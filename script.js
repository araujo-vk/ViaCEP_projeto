        document.addEventListener('DOMContentLoaded', function() {
            // Elementos da interface
            const tabs = document.querySelectorAll('.tab');
            const tabContents = document.querySelectorAll('.tab-content');
            const cepInput = document.getElementById('cep');
            const estadoSelect = document.getElementById('estado');
            const cidadeInput = document.getElementById('cidade');
            const logradouroInput = document.getElementById('logradouro');
            const buscarCepBtn = document.getElementById('buscar-cep');
            const buscarEnderecoBtn = document.getElementById('buscar-endereco');
            const limparCepBtn = document.getElementById('limpar-cep');
            const limparEnderecoBtn = document.getElementById('limpar-endereco');
            const limparHistoricoBtn = document.getElementById('limpar-historico');
            const resultadoCep = document.getElementById('resultado-cep');
            const resultadoEndereco = document.getElementById('resultado-endereco');
            const loadingCep = document.getElementById('loading-cep');
            const loadingEndereco = document.getElementById('loading-endereco');
            const historicoLista = document.getElementById('historico-lista');

            // Alternar entre abas
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabId = tab.getAttribute('data-tab');
                    
                    // Remover classe active de todas as tabs e conteúdos
                    tabs.forEach(t => t.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    // Adicionar classe active à tab clicada e ao conteúdo correspondente
                    tab.classList.add('active');
                    document.getElementById(`${tabId}-content`).classList.add('active');
                    
                    // Se for a aba de histórico, atualizar a lista
                    if (tabId === 'historico') {
                        carregarHistorico();
                    }
                });
            });

            // Formatar CEP (apenas números e limitar a 8 caracteres)
            cepInput.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '').slice(0, 8);
            });

            // Buscar endereço por CEP
            buscarCepBtn.addEventListener('click', function() {
                const cep = cepInput.value.trim();
                
                // Validação do CEP
                if (cep.length !== 8) {
                    mostrarResultado(resultadoCep, 'Por favor, digite um CEP válido com 8 dígitos.', 'erro');
                    return;
                }
                
                // Mostrar loading
                loadingCep.style.display = 'block';
                resultadoCep.style.display = 'none';
                
                // Fazer requisição à API ViaCEP
                fetch(`https://viacep.com.br/ws/${cep}/json/`)
                    .then(response => response.json())
                    .then(data => {
                        loadingCep.style.display = 'none';
                        
                        if (data.erro) {
                            mostrarResultado(resultadoCep, 'CEP não encontrado.', 'erro');
                        } else {
                            const endereco = `
                                <strong>Logradouro:</strong> ${data.logradouro || 'Não informado'}<br>
                                <strong>Bairro:</strong> ${data.bairro || 'Não informado'}<br>
                                <strong>Cidade:</strong> ${data.localidade}<br>
                                <strong>Estado:</strong> ${data.uf}
                            `;
                            mostrarResultado(resultadoCep, endereco, 'sucesso');
                            
                            // Salvar no histórico
                            salvarNoHistorico({
                                tipo: 'cep',
                                consulta: cep,
                                resultado: data
                            });
                        }
                    })
                    .catch(error => {
                        loadingCep.style.display = 'none';
                        mostrarResultado(resultadoCep, 'Erro ao buscar o CEP. Tente novamente.', 'erro');
                        console.error('Erro:', error);
                    });
            });

            // Buscar CEP por endereço
            buscarEnderecoBtn.addEventListener('click', function() {
                const estado = estadoSelect.value;
                const cidade = cidadeInput.value.trim();
                const logradouro = logradouroInput.value.trim();
                
                // Validação dos campos
                if (!estado || !cidade || !logradouro) {
                    mostrarResultado(resultadoEndereco, 'Por favor, preencha todos os campos.', 'erro');
                    return;
                }
                
                // Mostrar loading
                loadingEndereco.style.display = 'block';
                resultadoEndereco.style.display = 'none';
                
                // Fazer requisição à API ViaCEP
                fetch(`https://viacep.com.br/ws/${estado}/${cidade}/${logradouro}/json/`)
                    .then(response => response.json())
                    .then(data => {
                        loadingEndereco.style.display = 'none';
                        
                        if (data.erro || data.length === 0) {
                            mostrarResultado(resultadoEndereco, 'Endereço não encontrado.', 'erro');
                        } else {
                            let resultadosHTML = '';
                            
                            if (Array.isArray(data)) {
                                data.forEach(item => {
                                    resultadosHTML += `
                                        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                                            <strong>CEP:</strong> ${item.cep}<br>
                                            <strong>Logradouro:</strong> ${item.logradouro}<br>
                                            <strong>Bairro:</strong> ${item.bairro}<br>
                                            <strong>Cidade:</strong> ${item.localidade}<br>
                                            <strong>Estado:</strong> ${item.uf}
                                        </div>
                                    `;
                                });
                            } else {
                                resultadosHTML = `
                                    <strong>CEP:</strong> ${data.cep}<br>
                                    <strong>Logradouro:</strong> ${data.logradouro}<br>
                                    <strong>Bairro:</strong> ${data.bairro}<br>
                                    <strong>Cidade:</strong> ${data.localidade}<br>
                                    <strong>Estado:</strong> ${data.uf}
                                `;
                            }
                            
                            mostrarResultado(resultadoEndereco, resultadosHTML, 'sucesso');
                            
                            // Salvar no histórico
                            salvarNoHistorico({
                                tipo: 'endereco',
                                consulta: `${logradouro}, ${cidade}, ${estado}`,
                                resultado: data
                            });
                        }
                    })
                    .catch(error => {
                        loadingEndereco.style.display = 'none';
                        mostrarResultado(resultadoEndereco, 'Erro ao buscar o endereço. Tente novamente.', 'erro');
                        console.error('Erro:', error);
                    });
            });

            // Limpar campos e resultados
            limparCepBtn.addEventListener('click', function() {
                cepInput.value = '';
                resultadoCep.style.display = 'none';
                resultadoCep.className = 'resultado';
            });

            limparEnderecoBtn.addEventListener('click', function() {
                estadoSelect.value = '';
                cidadeInput.value = '';
                logradouroInput.value = '';
                resultadoEndereco.style.display = 'none';
                resultadoEndereco.className = 'resultado';
            });

            limparHistoricoBtn.addEventListener('click', function() {
                localStorage.removeItem('historicoCep');
                carregarHistorico();
            });

            // Função para mostrar resultados
            function mostrarResultado(elemento, mensagem, tipo) {
                elemento.innerHTML = mensagem;
                elemento.style.display = 'block';
                elemento.className = `resultado ${tipo}`;
            }

            // Função para salvar no histórico
            function salvarNoHistorico(consulta) {
                let historico = JSON.parse(localStorage.getItem('historicoCep')) || [];
                
                // Adicionar nova consulta ao início do array
                historico.unshift({
                    data: new Date().toISOString(),
                    ...consulta
                });
                
                // Manter apenas as últimas 10 consultas
                if (historico.length > 10) {
                    historico = historico.slice(0, 10);
                }
                
                // Salvar no localStorage
                localStorage.setItem('historicoCep', JSON.stringify(historico));
                
                // Se estiver na aba de histórico, atualizar a lista
                if (document.getElementById('historico-content').classList.contains('active')) {
                    carregarHistorico();
                }
            }

            // Função para carregar o histórico
            function carregarHistorico() {
                const historico = JSON.parse(localStorage.getItem('historicoCep')) || [];
                
                if (historico.length === 0) {
                    historicoLista.innerHTML = '<p>Nenhuma consulta realizada ainda.</p>';
                    return;
                }
                
                let html = '';
                historico.forEach(item => {
                    const data = new Date(item.data).toLocaleString('pt-BR');
                    
                    html += `
                        <div class="historico-item" data-tipo="${item.tipo}" data-consulta="${item.consulta}">
                            <strong>${item.tipo === 'cep' ? 'CEP' : 'Endereço'}:</strong> ${item.consulta}<br>
                            <small>${data}</small>
                        </div>
                    `;
                });
                
                historicoLista.innerHTML = html;
                
                // Adicionar event listeners para os itens do histórico
                document.querySelectorAll('.historico-item').forEach(item => {
                    item.addEventListener('click', function() {
                        const tipo = this.getAttribute('data-tipo');
                        const consulta = this.getAttribute('data-consulta');
                        
                        if (tipo === 'cep') {
                            // Mudar para a aba de CEP e preencher o campo
                            tabs.forEach(t => t.classList.remove('active'));
                            tabContents.forEach(content => content.classList.remove('active'));
                            
                            document.querySelector('[data-tab="cep"]').classList.add('active');
                            document.getElementById('cep-content').classList.add('active');
                            
                            cepInput.value = consulta;
                            buscarCepBtn.click();
                        } else {
                            // Mudar para a aba de endereço
                            tabs.forEach(t => t.classList.remove('active'));
                            tabContents.forEach(content => content.classList.remove('active'));
                            
                            document.querySelector('[data-tab="endereco"]').classList.add('active');
                            document.getElementById('endereco-content').classList.add('active');
                            
                            // Tentar preencher os campos (formato: "logradouro, cidade, estado")
                            const partes = consulta.split(', ');
                            if (partes.length >= 3) {
                                logradouroInput.value = partes[0];
                                cidadeInput.value = partes[1];
                                estadoSelect.value = partes[2];
                                buscarEnderecoBtn.click();
                            }
                        }
                    });
                });
            }
        });
