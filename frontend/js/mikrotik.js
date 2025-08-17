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
                const mounts = $('#mounts').val().split(',').map(s => s.trim()).filter(Boolean);
                const payload = {
                        name: $('#cname').val(),
                        interface: $('#iface').val(),
                        envlist: $('#envlist').val(),
                        mounts: mounts,
                        ports: $('#ports').val(),
                };
                await fetch('/mikrotik/containers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                });
                alert('Контейнер создан');
        });

        $('#env-save').on('click', async () => {
                const vars = {};
                $('#env-vars').val().split('\n').forEach(line => {
                        const [k, v] = line.split('=');
                        if (k && v !== undefined) {
                                vars[k.trim()] = v.trim();
                        }
                });
                await fetch('/mikrotik/envlists', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: $('#env-name').val(), vars }),
                });
                alert('Envlist сохранён');
        });

        $('#vol-create').on('click', async () => {
                const payload = {
                        name: $('#vol-name').val(),
                        src: $('#vol-src').val(),
                        dst: $('#vol-dst').val(),
                };
                await fetch('/mikrotik/volumes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                });
                alert('Том создан');
        });

        $('#veth-create').on('click', async () => {
                const name = $('#veth-name').val();
                await fetch('/mikrotik/veth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name }),
                });
                if ($('#veth-list').val()) {
                        await fetch(`/mikrotik/veth/${name}/interface-list`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ list: $('#veth-list').val() }),
                        });
                }
                if ($('#veth-bridge').val()) {
                        await fetch(`/mikrotik/veth/${name}/bridge`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ bridge: $('#veth-bridge').val() }),
                        });
                }
                if ($('#veth-addr').val()) {
                        await fetch(`/mikrotik/veth/${name}/address`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ address: $('#veth-addr').val() }),
                        });
                }
                alert('veth создан');
        });

        $('#fw-show').on('click', async () => {
                const data = await fetch('/mikrotik/firewall/filter').then(r => r.json());
                console.log('Firewall rules', data);
                alert('Правила выведены в консоль');
        });

        $('#fw-add').on('click', async () => {
                let rule;
                try {
                        rule = JSON.parse($('#fw-rule').val());
                } catch (e) {
                        alert('Неверный JSON');
                        return;
                }
                await fetch('/mikrotik/firewall/filter', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(rule),
                });
                alert('Правило добавлено');
        });
});
