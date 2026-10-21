// Enter only verified, deduplicated figures. Leave null until verified.
// people: unique beneficiaries reached (not event attendances).
// projects: completed or delivered initiatives, using one consistent definition.
// partners: active, confirmed partner organisations.
window.CHANGING_LIVES_IMPACT = { people: 10000, projects: 100, partners: 10 };
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[data-metric]').forEach(el=>{const value=window.CHANGING_LIVES_IMPACT[el.dataset.metric];if(Number.isFinite(value)&&value>=0){el.textContent=new Intl.NumberFormat('en-ZA').format(value)+'+'}else{el.textContent='—'}})});
