import minu from 'minu';

minu.init();
minu.config({ headers: { 'X-Test': '1' }, timeout: 1000, credentials: 'include' });
minu.reloadComponents(['#a', '#b']);
minu.reloadComponent('#a');
minu.closeStream();
minu.destroy();

document.addEventListener('minu:contentLoaded', (event) => {
    const html: string = event.detail.html;
    const method: string = event.detail.method;
    console.log(html, method);
});

document.addEventListener('minu:beforeRequest', (event) => {
    const element: Element = event.detail.element;
    event.preventDefault();
    console.log(element);
});

document.addEventListener('minu:contentError', (event) => {
    const error: Error = event.detail.error;
    console.log(error.message);
});

document.addEventListener('minu:trigger:refresh', (event) => {
    const name: string = event.detail.name;
    console.log(name);
});

const element = document.createElement('div');
element.addEventListener('minu:sseMessage', (event) => {
    const data: string = event.detail.data;
    console.log(data);
});
