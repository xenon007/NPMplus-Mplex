$(document).ready(() => {
        $('#save').on('click', async () => {
                const payload = {
                        host: $('#host').val(),
                        user: $('#user').val(),
                        pass: $('#pass').val(),
                        ssl: $('#ssl').is(':checked'),
                };
                await fetch('/mikrotik/credentials', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                });
                alert('Сохранено');
        });

        $('#create').on('click', async () => {
                const payload = {
                        name: $('#cname').val(),
                        interface: $('#iface').val(),
                        ports: $('#ports').val(),
                };
                await fetch('/mikrotik/containers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                });
                alert('Контейнер создан');
        });
});
