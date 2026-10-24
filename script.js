// Sahifadagi kataklar va natija joylarini topamiz.
const form = document.querySelector('.calculator-form');
const fields = [
    document.getElementById('purchase-price'),
    document.getElementById('sale-price'),
    document.getElementById('quantity')
];
const statusText = document.getElementById('form-status');
const resultValues = document.getElementById('result-values');
const resultEmpty = document.getElementById('result-empty');
const money = new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 2 });

// Namunani bir bosishda kataklarga joylab, haqiqiy hisobni bajaramiz.
document.getElementById('use-example').addEventListener('click', () => {
    [10000, 15000, 20].forEach((value, index) => {
        fields[index].value = String(value);
    });
    form.requestSubmit();
    document.getElementById('hisoblagich').scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start'
    });
});

// Pulni tiyinlarda hisoblash kasr sonlarni yaxlitlash xatolarini kamaytiradi.
function calculateSale(purchasePrice, salePrice, quantity) {
    const cost = Math.round(Number(purchasePrice.toFixed(2)) * 100) * quantity;
    const revenue = Math.round(Number(salePrice.toFixed(2)) * 100) * quantity;
    if (!Number.isSafeInteger(cost) || !Number.isSafeInteger(revenue)) {
        throw new Error('Sonlar juda katta. Kichikroq qiymatlar kiriting.');
    }
    return { cost: cost / 100, revenue: revenue / 100, profit: (revenue - cost) / 100 };
}

function clearError(field) {
    field.removeAttribute('aria-invalid');
    document.getElementById(field.id + '-error')?.remove();
    field.setAttribute('aria-describedby', field.getAttribute('aria-describedby').replace(' ' + field.id + '-error', ''));
}

function showError(field, message) {
    const error = document.createElement('p');
    error.id = field.id + '-error';
    error.className = 'field-error';
    error.textContent = message;
    field.after(error);
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', field.getAttribute('aria-describedby') + ' ' + error.id);
}

// Brauzer reset orqali kataklarni bo‘shatadi, biz natija va xabarlarni tozalaymiz.
form.addEventListener('reset', () => {
    fields.forEach(clearError);
    resultValues.hidden = true;
    resultEmpty.hidden = false;
    ['revenue', 'cost', 'profit-value', 'result-detail'].forEach(id => {
        document.getElementById(id).textContent = '';
    });
    document.getElementById('profit-box').className = 'profit';
    document.getElementById('profit-label').textContent = 'Foyda';
    statusText.textContent = 'Kataklar tozalandi. Yangi hisob uchun ma’lumot kiriting.';
    fields[0].focus();
});

// Raqam o‘zgarsa, eski natijani yashiramiz: u endi yangi qiymatlarga mos emas.
fields.forEach(field => field.addEventListener('input', () => {
    clearError(field);
    resultValues.hidden = true;
    resultEmpty.hidden = false;
    statusText.textContent = 'Natijani ko‘rish uchun “Hisoblash” tugmasini bosing.';
}));

// Tugma bosilganda sahifani yangilamay, hisobni shu yerda bajaramiz.
form.addEventListener('submit', event => {
    event.preventDefault();
    resultValues.hidden = true;
    resultEmpty.hidden = false;
    let firstInvalid = null;
    fields.forEach((field, index) => {
        clearError(field);
        let message = '';
        const value = field.valueAsNumber;
        if (field.validity.badInput) message = 'To‘g‘ri son kiriting.';
        else if (field.value.trim() === '') message = index === 2 ? 'Sotilgan mahsulot sonini kiriting.' : 'Narxni kiriting.';
        else if (!Number.isFinite(value) || value < 0) message = 'Nol yoki undan katta son kiriting.';
        else if (index === 2 && (!Number.isSafeInteger(value) || value < 1)) message = 'Kamida 1 dona kiriting. Son butun bo‘lishi kerak.';
        else if (field.validity.stepMismatch) message = 'Narxni ko‘pi bilan ikkita kasr xonasi bilan kiriting.';
        if (message) {
            showError(field, message);
            firstInvalid ??= field;
        }
    });
    if (firstInvalid) {
        statusText.textContent = 'Belgilangan kataklardagi ma’lumotlarni tekshiring.';
        firstInvalid.focus();
        return;
    }
    let result;
    try {
        result = calculateSale(...fields.map(field => field.valueAsNumber));
    } catch (error) {
        statusText.textContent = error.message;
        return;
    }
    const formatMoney = value => money.format(value) + ' so‘m';
    document.getElementById('revenue').textContent = formatMoney(result.revenue);
    document.getElementById('cost').textContent = formatMoney(result.cost);
    document.getElementById('profit-label').textContent = result.profit > 0 ? 'Foyda' : result.profit < 0 ? 'Zarar' : 'Foyda ham, zarar ham yo‘q';
    document.getElementById('profit-value').textContent = (result.profit > 0 ? '+' : '') + formatMoney(result.profit);
    document.getElementById('profit-box').className = 'profit' + (result.profit < 0 ? ' is-loss' : result.profit === 0 ? ' is-neutral' : '');
    document.getElementById('result-detail').textContent = money.format(fields[2].valueAsNumber) + ' dona mahsulot uchun hisob. Tushum − xarid xarajati = natija.';
    resultValues.hidden = false;
    resultEmpty.hidden = true;
    statusText.textContent = 'Hisob tayyor. ' + document.getElementById('profit-label').textContent + ': ' + formatMoney(result.profit) + '.';
    // Kichik ekranda natija pastda bo‘ladi. Uni darhol o‘qish uchun tanlaymiz.
    if (window.matchMedia('(max-width: 680px)').matches) {
        document.getElementById('result-title').focus();
    }
});
