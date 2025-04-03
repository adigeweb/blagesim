function evaluateExpression(expression, xValue) {
    expression = expression.replace("\\e", `(${Math.E.toString()})`)
    expression = expression.replace("\\pi", `(${Math.PI.toString()})`)
    expression = expression.replace(/(\d+)(x)/g, '$1*$2');
    expression = expression.replace(/\*\*/g, '^');
    console.log(expression);
    
    const tokens = expression.match(/[-+*/()!^]|sin|cos|tan|sqrt|log|exp|x|\d+(\.\d+)?/g);
    const values = [];
    const ops = [];

    function applyOp() {
        const right = values.pop();
        let left;
        const op = ops.pop();
        switch (op) {
            case '+':
                left = values.pop();
                values.push(left + right);
                break;
            case '-':
                left = values.pop();
                values.push(left - right);
                break;
            case '*':
                left = values.pop();
                values.push(left * right);
                break;
            case '/':
                left = values.pop();
                values.push(left / right);
                break;
            case '^':
                left = values.pop();
                values.push(Math.pow(left, right));
                break;
            case 'sin':
                values.push(Math.sin(right));
                break;
            case 'cos':
                values.push(Math.cos(right));
                break;
            case 'tan':
                values.push(Math.tan(right));
                break;
            case 'sqrt':
                values.push(Math.sqrt(right));
                break;
            case 'log':
                values.push(Math.log(right));
                break;
            case 'exp':
                values.push(Math.exp(right));
                break;
            case '!':
                values.push(factorial(right));
                break;
        }
    }

    function factorial(n) {
        return n === 0 ? 1 : n * factorial(n - 1);
    }

    for (const token of tokens) {
        if (token === 'x') {
            values.push(xValue);
        } else if (!isNaN(token)) {
            values.push(parseFloat(token));
        } else if (token === '(') {
            ops.push(token);
        } else if (token === ')') {
            while (ops.length && ops[ops.length - 1] !== '(') {
                applyOp();
            }
            ops.pop();
        } else if (token === '!') {
            const num = values.pop();
            values.push(factorial(num));
        } else if (['+', '-', '*', '/', '^', 'sin', 'cos', 'tan', 'sqrt', 'log', 'exp'].includes(token)) {
            while (ops.length && precedence(token) <= precedence(ops[ops.length - 1])) {
                applyOp();
            }
            ops.push(token);
        }
    }
    while (ops.length) {
        applyOp();
    }
    return values[0];
}

function precedence(op) {
    if (op === '+' || op === '-') return 1;
    if (op === '*' || op === '/') return 2;
    if (op === '^') return 3;
    if (['sin', 'cos', 'tan', 'sqrt', 'log', 'exp'].includes(op)) return 4;
    return 0;
}