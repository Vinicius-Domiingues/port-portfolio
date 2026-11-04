        async function criarConta(e) {
            e.preventDefault();
            const btn = document.getElementById('btnCriar');
            const msgErro = document.getElementById('msgErro');
            const msgSucesso = document.getElementById('msgSucesso');
            msgErro.classList.add('hidden');
            msgSucesso.classList.add('hidden');

            const senha = document.getElementById('senha').value;
            const senhaConfirmar = document.getElementById('senhaConfirmar').value;

            if (senha !== senhaConfirmar) {
                msgErro.textContent = 'As senhas não coincidem.';
                msgErro.classList.remove('hidden');
                return;
            }

            btn.textContent = 'Criando...';
            btn.disabled = true;

            try {
                const response = await apiFetch(`${API_BASE_URL}/api/auth/registro`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome: document.getElementById('nome').value.trim(),
                        email: document.getElementById('email').value.trim(),
                        senha
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    msgSucesso.textContent = 'Usuário registrado! A conta já pode solicitar selos.';
                    msgSucesso.classList.remove('hidden');
                    document.getElementById('formRegistro').reset();
                    
                    document.getElementById('cadastroUsuario').close();
                    await carregarUsuarios();
                } else {
                    msgErro.textContent = data.error || 'Erro ao criar conta.';
                    msgErro.classList.remove('hidden');
                }
            } catch (err) {
                msgErro.textContent = 'Erro de conexão com o servidor.';
                msgErro.classList.remove('hidden');
            } finally {
                btn.textContent = 'Registrar usuário';
                btn.disabled = false;
            }
        }
