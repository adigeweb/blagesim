if (!navigator.onLine) {
    location.href = "/offline";
}

const series = {
    PI_LEIBNIZ: "(4)/(x)-(4)/(x+2)"
}

var stepGlobal = 1;
var saveGlobal = [];
var publicTemps = {};

const run = (serie, opts, callback) => {
    if (activeInterval) return;
    var pointer = 0;
    var x = 1;
    activeInterval = setInterval(() => {
        if (paused) return;
        var lastPointer = pointer;
        pointer += evaluateExpression(serie, x);
        callback(pointer, x);
        stepGlobal = x;
        saveGlobal.push({
            x: x,
            change: evaluateExpression(serie, x),
            pointer: pointer
        });
        document.querySelectorAll(".result p .approximation").forEach(item => {
            if (x % item.getAttribute("data-per") != 0) return;
            item.innerText = Math.abs(lastPointer - item.getAttribute("data-val")) - Math.abs(pointer - item.getAttribute("data-val"));
        });
        x += parseInt(opts["change"]);
    }, opts["delay"] ? opts["delay"] : 50);
}

const yazdir = (...args) => {
    let fixed = args[0];
    if (!document.querySelector("input#max").checked) fixed = fixed.toFixed(document.querySelector("input#fixed").value);
    document.querySelector(".result .value").innerText = fixed;
    document.querySelector(".result .step").innerText = args[1];
}

const sifirla = () => {
    clearInterval(activeInterval);
    activeInterval = null;
    document.querySelector(".result .value").innerText = 0;
    document.querySelector(".result .step").innerText = 0;
    paused = false;
    stepGlobal = 1;
    saveGlobal = [];
    document.querySelectorAll(".result p:has(.approximation)").forEach(item => { item.remove() });
}

const textarea = document.querySelector(".latex-input textarea");
const built_in = document.querySelector("select#built-in");

var paused = false;
var activeInterval = null;

window.addEventListener("load", () => {
    Object.keys(series).forEach(item => {
        var opt = document.createElement("option");
        opt.innerText = item;
        opt.value = item;
        built_in.appendChild(opt);
    });
    document.querySelector("#run").addEventListener("click", () => {
        let term;
        if (textarea.disabled) term = series[built_in.value];
        else term = new Calc(textarea.value).expr;
        console.log(term);
        paused = false;
        run(
            term,
            {
                delay: document.querySelector("#delay").value,
                change: document.querySelector("#change").value
            },
            yazdir
        );
    });
    document.querySelector("#pause").addEventListener("click", () => { paused = !paused });
    document.querySelector("#reset").addEventListener("click", sifirla);
    document.querySelector("#tools").addEventListener("click", showTools);
    document.querySelectorAll(".latex .latex-control button").forEach(item => {
        item.addEventListener("click", () => {
            if (document.activeElement != textarea) textarea.focus();
            let pos = getCaretPosition(textarea);
            shortcut(item.getAttribute("data-key"), { start: pos.start + 1, end: pos.end + 1 }, textarea);
        });
    });
    info();
});

const getCaretPosition = (ctrl) => {
    if (document.selection) {
        ctrl.focus();
        var range = document.selection.createRange();
        var rangelen = range.text.length;
        range.moveStart("character", -ctrl.value.length);
        var start = range.text.length - rangelen;
        return {
            "start": start,
            "end": start + rangelen
        };
    } 
    else if (ctrl.selectionStart || ctrl.selectionStart == "0") {
        return {
            "start": ctrl.selectionStart,
            "end": ctrl.selectionEnd
        };
    } else {
        return {
            "start": 0,
            "end": 0
        };
    }
}

const setCaretPosition = (ctrl, start, end) => {
    if (ctrl.setSelectionRange) {
        ctrl.focus();
        ctrl.setSelectionRange(start, end);
    }
    else if (ctrl.createTextRange) {
        var range = ctrl.createTextRange();
        range.collapse(true);
        range.moveEnd("character", end);
        range.moveStart("character", start);
        range.select();
    }
}

const handleType = (input) => {
    var change = (event) => {
        document.querySelector(".latex-input span.error").style.visibility = "hidden";
        let pos = getCaretPosition(input);
        if (shortcutList[event.data]) shortcut(event.data, pos, input);
        document.querySelector(".latex-display").innerHTML = `\\[${input.value}\\]`;
        renderMathInElement(document.body);
        if (input.value == "" && built_in.value == "none") {
            document.querySelectorAll(".control button").forEach(item => {
                item.disabled = true;
            });
        }
        else document.querySelectorAll(".control button").forEach(item => {
            item.disabled = false;
        });
    };
    input.addEventListener("paste", () => { change(event) });
    input.addEventListener("input", () => { change(event) });
}

const shortcut = (char, pos, input) => {
    let arr = input.value.split("");
    arr.splice(pos.start - 1, 1);
    input.value = arr.join("");
    setCaretPosition(input, pos.start - 1, pos.start - 1);
    input.value = input.value.substring(0, getCaretPosition(input).start) + shortcutList[char][0] + input.value.substring(getCaretPosition(input).start, input.value.length);
    setCaretPosition(input, pos.start - 1 + shortcutList[char][1], pos.start - 1 + shortcutList[char][1]);
    renderMathInElement(document.body);
}

const shortcutList = {
    "/": ["\\frac{x}{y}", 7],
    "'": ["^{x}", 3],
    "P": ["\\pi", 3]
}

const showTools = () => {
    Swal.fire({
        title: "Araçlar",
        html: `
            <div class="tools-container">
                <button id="draw-graph">Grafik Çizdir</button>
                <button id="approximate-value">Değere Yaklaşma Hızını Göster</button>
                <button id="export">Dışarı Aktar</button>
            </div>
        `,
        backdrop: `
            rgba(0,0,123,0.4)
            url("backdrop.png")
            left top
            no-repeat
        `,
        didOpen: () => {
            setTimeout(() => {
                document.querySelector("#draw-graph").addEventListener("click", () => {
                    Swal.fire({
                        title: "Grafik Çizdir",
                        html: `
                            <label>Grafik Türü: <select>
                                <option value="term" disabled>x-terim grafiği</option>
                                <option value="pointer" selected>son x-toplam grafiği</option>
                            </select></label><br>
                            <label>
                                Aralık: [<input id="min-graph" type="number" value="0">,<input id="max-graph" type="number" value="${stepGlobal}" max="${stepGlobal}">]'daki tamsayılar
                            </label><br>
                            <label>
                                Çizgi Rengi: <input id="stroke-style" type="color" value="#F00">
                            </label>
                        `,
                        showCancelButton: true,
                        cancelButtonText: "İptal",
                        confirmButtonText: "Çiz",
                        preConfirm: () => {
                            return (new Promise(resolve => {
                                const values = {
                                    min: document.querySelector("input#min-graph").value,
                                    max: document.querySelector("input#max-graph").value,
                                    col: document.querySelector("input#stroke-style").value,
                                    max_v: Math.max(...saveGlobal.map(x => (parseFloat(x.pointer) + 0.5).toFixed(1))).toString(),
                                    min_v: Math.min(...saveGlobal.map(x => (parseFloat(x.pointer) - 0.5).toFixed(1))).toString()
                                }
                                var canvas = document.createElement("canvas");
                                var ctx = canvas.getContext("2d");
                                ctx.fillStyle = "#FFF";
                                ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
                                ctx.fillStyle = "#000";
                                ctx.font = "18px Arial";
                                ctx.strokeStyle = "black";
                                ctx.moveTo(40, 20);
                                ctx.lineTo(40, canvas.height - 40);
                                ctx.stroke();
                                ctx.moveTo(40, canvas.height - 40);
                                ctx.lineTo(canvas.width - 20, canvas.height - 40);
                                ctx.stroke();
                                ctx.moveTo(35, 25);
                                ctx.lineTo(40, 20);
                                ctx.stroke();
                                ctx.moveTo(45, 25);
                                ctx.lineTo(40, 20);
                                ctx.stroke();
                                ctx.moveTo(canvas.width - 25, canvas.height - 35);
                                ctx.lineTo(canvas.width - 20, canvas.height - 40);
                                ctx.stroke();
                                ctx.moveTo(canvas.width - 25, canvas.height - 45);
                                ctx.lineTo(canvas.width - 20, canvas.height - 40);
                                ctx.stroke();
                                ctx.fillText(values.min, 40, canvas.height - 18);
                                ctx.fillText(values.max, canvas.width - 40, canvas.height - 18);
                                ctx.strokeStyle = values.col;
                                ctx.moveTo(40, canvas.height - 40); 
                                ctx.fillText(values.max_v, 20 - 6 * (values.max_v.toString().length - 1), 30);
                                ctx.fillText(values.min_v, 20 - 5 * values.min_v.toString().length, canvas.height - 40);
                                saveGlobal.forEach((item, index) => {
                                    ctx.lineTo(40 + (index + 1) * ((canvas.width - 60) / (values.max - values.min)), 20 + ((item.pointer - values.min_v) / (values.max_v - values.min_v) * canvas.height - 60));
                                    ctx.stroke();
                                    ctx.moveTo(40 + (index + 1) * ((canvas.width - 60) / (values.max - values.min)), 20 + ((item.pointer - values.min_v) / (values.max_v - values.min_v) * canvas.height - 60));
                                    if (index == saveGlobal.length - 1) {
                                        ctx.fillText("≈" + item.pointer.toFixed(2).toString(), (index + 1) * ((canvas.width - 60) / (values.max - values.min)), 10 + ((item.pointer - values.min_v) / (values.max_v - values.min_v) * canvas.height - 60))
                                    }
                                });
                                var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
                                publicTemps["graph-data-url"] = canvas.toDataURL();
                                resolve(imgData);
                            }));
                        }
                    }).then(result => {
                        if (!result.isConfirmed) return;
                        Swal.fire({
                            html: `
                                <canvas id="graph-output"></canvas><br>
                                <i>Henüz geliştirme aşamasındadır. Grafik hatalı olabilir.</i>
                            `,
                            showDenyButton: true,
                            denyButtonText: "İndir",
                            didOpen: () => {
                                var ctx = document.querySelector("#graph-output").getContext("2d");
                                ctx.putImageData(result.value, 10, 10);
                            }
                        }).then((result) => {
                            return (new Promise((resolve, reject) => {
                                if (result.isConfirmed) resolve();
                                else if (result.isDenied) {
                                    console.log("indirrrr");
                                    var link = document.createElement("a");
                                    link.download = "grafik-blagesim.png";
                                    link.href = publicTemps["graph-data-url"];
                                    link.click();
                                    delete publicTemps["graph-data-url"];
                                    reject();
                                }
                            }));
                        });
                    });
                });
                document.querySelector("#approximate-value").addEventListener("click", () => {
                    Swal.fire({
                        title: "Değere Yaklaşma Hızını Göster",
                        html: `
                        <label>Yaklaşılan değer: <input id="value-to-approximate" type="number"></label><br>
                        <label>Güncelleme Periyotu: <input id="update-period" type="number" value="1" min="1" max="5000"></label>
                        `,
                        preConfirm: () => {
                            return (new Promise(resolve => {
                                const values = {
                                    valueToApp: document.querySelector("#value-to-approximate").value,
                                    updatePer: document.querySelector("#update-period").value
                                }
                                resolve(values);
                            }));
                        }
                    }).then((result) => {
                        if (!(result.value.valueToApp && result.value.updatePer)) return;
                        var text = document.createElement("p");
                        text.innerText = `${result.value.valueToApp}'e yaklaşma hızı: `;
                        var value = document.createElement("span");
                        value.className = "approximation";
                        text.appendChild(value);
                        text.addEventListener("click", () => {text.remove() });
                        value.setAttribute("data-val", result.value.valueToApp);
                        value.setAttribute("data-per", result.value.updatePer);
                        document.querySelector(".result").appendChild(text);
                    });
                });
                document.querySelector("#export").addEventListener("click", () => {
                    Swal.fire({
                        title: "Dışarı Aktar",
                        html: `
                        <label>Dışarı aktarma aralığı: [<input id="export-min" type="number" value="1" min="1" max="${stepGlobal - 1}">, <input id="export-max" type="number" value="${stepGlobal}" min="2" max="${stepGlobal}">]</label><br>
                        <label>Dışarı aktarma biçimi: <select id="export-type">
                            <option value="text/txt">Düz Metin (.txt)</option>
                            <option value="text/html">HTML Dokümanı (.html)</option>
                            <option value="text/json">JSON Dokümanı (.json)</option>
                        </select></label>
                        `,
                        preConfirm: () => {
                            return (new Promise(resolve => {
                                const values = {
                                    range: [document.querySelector("#export-min").value, document.querySelector("#export-max").value],
                                    type: document.querySelector("#export-type").value
                                }
                                resolve(values);
                            }));
                        }
                    }).then((result) => {
                        if (!(result.value.range && result.value.type && result.value.type[0] && result.value.type[1])) return;
                        var fileContent = "";
                        switch (result.value.type) {
                            case "text/txt":
                                fileContent += `${"x değeri".padEnd(20, " ")}|${"Terim değeri".padEnd(20, " ")}|${"Toplam değer".padEnd(20, " ")}\n`;
                                saveGlobal.forEach(item => {
                                    if (item.x < result.value.range[1] && item.x > result.value.range[0]) {
                                        fileContent += `${item.x.toString().padEnd(20, " ")}|${item.change.toFixed(15).toString().padEnd(20, " ")}|${item.pointer.toFixed(15).toString().padEnd(20, " ")}\n`;
                                    }
                                });
                                break;
                            case "text/html":
                                fileContent += `
                                    <html>
                                        <head>
                                            <title>BlageSim</title>
                                            <style>
                                                table, th, td {
                                                    border: 1px solid black;
                                                    border-collapse: collapse;
                                                }
                                            </style>
                                        </head>
                                        <body>
                                            <table>
                                                <tr>
                                                    <th>x değeri</th>
                                                    <th>Terim değeri</th>
                                                    <th>Toplam değer</th>
                                                </tr>
                                `;
                                saveGlobal.forEach(item => {
                                    if (item.x < result.value.range[1] && item.x > result.value.range[0]) {
                                        fileContent += `
                                                        <tr>
                                                            <td>${item.x.toString()}</td>
                                                            <td>${item.change.toFixed(15).toString()}</td>
                                                            <td>${item.pointer.toFixed(15).toString()}</td>
                                                        </tr>
                                        `;
                                    }
                                });
                                fileContent += `
                                            </table>
                                        </body>
                                    </html>
                                `;
                                break;
                            case "text/json":
                                fileContent += `
                                    [
                                `;
                                let first = true;
                                saveGlobal.forEach(item => {
                                    if (item.x < result.value.range[1] && item.x > result.value.range[0]) {
                                        fileContent += `
                                                ${!first ? "," : ""}{
                                                    "x-degeri": ${item.x.toString()},
                                                    "terim-degeri": ${item.change.toFixed(15).toString()},
                                                    "toplam-deger": ${item.pointer.toFixed(15).toString()}
                                                }
                                        `;
                                        first = false;
                                    }
                                });
                                fileContent += `
                                    ]
                                `;
                            default:
                                break;
                        }
                        if (!fileContent) return;
                        Swal.fire({
                            title: "Dışarı Aktar",
                            html: `
                                <p class="code">
                                    ${fileContent.replace("\\n", "<br>")}
                                </p>
                            `,
                            showDenyButton: true,
                            denyButtonText: "İndir"
                        }).then(innerResult => {
                            if (innerResult.isConfirmed) return;
                            else if (innerResult.isDenied) {
                                download(fileContent, `blagesim.${result.value.type.split("/")[1]}`, result.value.type);
                            }
                        });
                    });
                });
            }, 500);
        }
    });
}

handleType(textarea);

built_in.addEventListener("change", () => {
    if (built_in.value != "none") {
        textarea.disabled = true;
        document.querySelector("#change").disabled = true;
        document.querySelectorAll(".control button").forEach(item => {
            item.disabled = false;
        });
        if (built_in.value == "PI_LEIBNIZ") {
            document.querySelector("#change").value = 4;
        }
    }
    else {
        textarea.disabled = false;
        document.querySelector("#change").disabled = false;
        if (textarea.value = "") {
            document.querySelectorAll(".control button").forEach(item => {
                item.disabled = true;
            });
        }
    }
});

document.querySelector("input#max").addEventListener("change", () => {
    if (document.querySelector("input#max").checked) document.querySelector("input#fixed").disabled = true;
    else document.querySelector("input#fixed").disabled = false;
});

var logOfConsole = [];

var _log = console.log,
    _warn = console.warn,
    _error = console.error;

console.log = function() {
    logOfConsole.push({method: "log", arguments: arguments});
    return _log.apply(console, arguments);
};

console.warn = function() {
    logOfConsole.push({method: "warn", arguments: arguments});
    return _warn.apply(console, arguments);
};

console.error = function() {
    logOfConsole.push({method: "error", arguments: arguments});
    consoleCallbacks.error(arguments);
    return _error.apply(console, arguments);
};

const consoleCallbacks = {
    error: (args) => {
        document.querySelector(".latex-input span.error").style.visibility = "visible";
        publicTemps["error-info"] = args;
    }
}

document.querySelector("button#input-help").addEventListener("click", () => {
    Swal.fire({
        icon: "error",
        title: "Hata Bilgileri",
        html: `
            ${publicTemps["error-info"][0]}<br>
            <i>Not: Girdiler, standart <a href="https://tr.wikipedia.org/wiki/LaTeX" target="_blank">LaTeX</a> formunda olmalıdır.</i>
        `
    });
});

const info = () => {
    if (localStorage.getItem("visited-blagesim-before")) return;
    Swal.fire({
        icon: "info",
        title: "Merhaba!",
        html: "Şu an sonsuz dizi yakınsama motoru (?) BlageSim'in demo sürümünü görüntülüyorsunuz. Amaç; terimleri birbirine benzeyen, sonsuza dek uzayıp giden dizileri (örneğin Leibniz'in Pi açılımı) hızlı şekilde yakınsayabilmek. Lütfen hesaplamalarda <b>hatalar olabileceğini</b> unutmayın. Bulduğunuz bir bug'ı veya aklınıza gelen bir fikri X'de <a href=\"https://twitter.com/@kumkuatte\" target=\"_blank\">@kumkuatte</a>'ye iletebilirsiniz. İyi eğlenceler!"
    }).then(() => {
        localStorage.setItem("visited-blagesim-before", "true");
    });
}

document.querySelector(".question").addEventListener("click", info);

let y = evaluateExpression("10!", 2);
console.log(y);

const download = (content, filename, contentType) => {
    if (!contentType) contentType = 'application/octet-stream';
    var a = document.createElement('a');
    var blob = new Blob([content], {'type':contentType});
    a.href = window.URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}