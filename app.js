// ======================= INICIALIZAÇÃO =======================

// Carrega compras e fornecedores do localStorage (ou cria arrays vazios se não existir)
let compras = JSON.parse(localStorage.getItem('compras') || '[]');
let fornecedores = JSON.parse(localStorage.getItem('fornecedores') || '[]');

// Seleciona os botões de abas e as seções de conteúdo
const tabs = document.querySelectorAll('.list-group-item');
const sections = document.querySelectorAll('.tab');


// ======================= SISTEMA DE ABAS =======================

tabs.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove "active" de todas as abas
        tabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Esconde todos os conteúdos
        sections.forEach(s => s.classList.remove('active'));

        // Mostra o conteúdo da aba selecionada
        document.getElementById(btn.dataset.tab).classList.add('active');

        // Atualiza dashboard e compras ao trocar de aba
        updateDashboard();
        renderCompras();
    });
});


// ======================= AUTENTICAÇÃO =======================

// Verifica se existe usuário logado
const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// Se não estiver logado → volta para login
if (!currentUser) {
    window.location.href = 'login.html';
} else {
    // Coloca o nome do usuário no topo
    document.getElementById('userName').textContent = currentUser.name || currentUser.email;
}

// Botão de logout
document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
});


// ======================= FUNÇÃO GERAL DE SALVAR =======================

function saveAll() {
    localStorage.setItem('compras', JSON.stringify(compras));
    localStorage.setItem('fornecedores', JSON.stringify(fornecedores));
}


// ======================= DASHBOARD =======================
// Atualiza os números do painel inicial

function updateDashboard() {
    document.getElementById('totalCompras').textContent = compras.length;
    document.getElementById('totalFornecedores').textContent = fornecedores.length;

    const pend = compras.filter(c => c.status === 'pendente').length;
    document.getElementById('comprasPendentes').textContent = pend;
}


// ======================= FORNECEDORES =======================

// Adicionar fornecedor
document.getElementById('formFornecedor').addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = document.getElementById('fornecedorNome').value.trim();
    if (!nome) return alert('Digite o nome do fornecedor');

    fornecedores.push({ id: Date.now(), nome });

    saveAll();
    document.getElementById('fornecedorNome').value = '';

    renderFornecedores();
    atualizarSelectFornecedores();
    updateDashboard();
});


// Exibir fornecedores
function renderFornecedores() {
    const div = document.getElementById('listaFornecedores');
    div.innerHTML = '';

    fornecedores.forEach(f => {
        const el = document.createElement('div');
        el.className = 'd-flex align-items-center justify-content-between p-2 border rounded mb-2';

        el.innerHTML = `
            <div>${f.nome}</div>
            <div><button class="btn btn-sm btn-danger" data-id="${f.id}">Remover</button></div>
        `;

        div.appendChild(el);
    });

    // Botões de remover fornecedor
    div.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
            const id = Number(b.dataset.id);

            fornecedores = fornecedores.filter(x => x.id !== id);
            saveAll();

            renderFornecedores();
            atualizarSelectFornecedores();
            updateDashboard();
        });
    });
}


// ======================= COMPRAS =======================

// Registrar nova compra
document.getElementById('formCompra').addEventListener('submit', (e) => {
    e.preventDefault();

    const fornecedor = document.getElementById('fornecedor').value;
    const valor = parseFloat(document.getElementById('valor').value.replace(',', '.')) || 0;
    const tipo = document.getElementById('tipo').value;
    const descricao = document.getElementById('descricao').value.trim();
    const status = document.getElementById('status').value;

    if (!fornecedor) return alert('Escolha um fornecedor');
    if (!valor) return alert('Informe um valor válido');

    compras.push({
        id: Date.now(),
        fornecedor,
        valor,
        tipo,
        descricao,
        status,
        criadoEm: new Date().toISOString()
    });

    saveAll();
    renderCompras();
    updateDashboard();

    document.getElementById('formCompra').reset();
});


// Exibir compras
function renderCompras() {
    const div = document.getElementById('listaCompras');
    div.innerHTML = '';

    if (compras.length === 0) {
        div.innerHTML = '<div class="text-muted">Nenhuma compra registrada</div>';
        return;
    }

    // Mostra as mais recentes primeiro
    compras.slice().reverse().forEach(c => {
        const el = document.createElement('div');
        el.className = 'p-2 border rounded mb-2';

        el.innerHTML = `
            <div class="d-flex justify-content-between">
                <strong>${c.descricao}</strong>
                <small>${new Date(c.criadoEm).toLocaleString()}</small>
            </div>

            <div>
                ${c.fornecedor} • 
                ${c.valor.toLocaleString('pt-BR',{ style:'currency', currency:'BRL' })} • 
                ${c.tipo} • 
                <span class="badge bg-secondary">${c.status}</span>
            </div>

            <div class="mt-2">
                <button class="btn btn-sm btn-outline-primary me-2" data-id="${c.id}" data-act="toggle">
                    Alternar status
                </button>
                <button class="btn btn-sm btn-danger" data-id="${c.id}" data-act="del">
                    Remover
                </button>
            </div>
        `;

        div.appendChild(el);
    });

    // Botões das ações de compra
    div.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
            const id = Number(b.dataset.id);
            const act = b.dataset.act;

            // Remover compra
            if (act === 'del') {
                if (!confirm('Remover compra?')) return;
                compras = compras.filter(x => x.id !== id);
            }

            // Alternar status (pendente → enviado → cancelado)
            else if (act === 'toggle') {
                compras = compras.map(x =>
                    x.id === id
                        ? {
                            ...x,
                            status:
                                x.status === 'pendente'
                                    ? 'enviado'
                                    : x.status === 'enviado'
                                    ? 'cancelado'
                                    : 'pendente'
                        }
                        : x
                );
            }

            saveAll();
            renderCompras();
            updateDashboard();
        });
    });
}


// ======================= USUÁRIOS =======================

// Exibir lista de usuários
function renderUsuarios() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const div = document.getElementById('listaUsuarios');

    div.innerHTML = '';

    users.forEach(u => {
        const el = document.createElement('div');
        el.className = 'p-2 border rounded mb-2 d-flex justify-content-between align-items-center';

        el.innerHTML = `
            <div>
                <strong>${u.name}</strong><br>
                <small>${u.email}</small>
            </div>
            <div>
                <button class="btn btn-sm btn-danger" data-id="${u.id}">Remover</button>
            </div>
        `;

        div.appendChild(el);
    });

    // Botões de remover usuário
    div.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
            const id = Number(b.dataset.id);
            if (!confirm('Remover usuário?')) return;

            let users = JSON.parse(localStorage.getItem('users') || '[]');
            users = users.filter(x => x.id !== id);

            localStorage.setItem('users', JSON.stringify(users));
            renderUsuarios();
        });
    });
}


// ======================= ALTERAÇÃO DE SENHA =======================

document.getElementById('formSenha').addEventListener('submit', (e) => {
    e.preventDefault();

    const oldP = document.getElementById('oldPass').value;
    const newP = document.getElementById('newPass').value;

    if (!oldP || !newP) return alert('Preencha as senhas');

    let users = JSON.parse(localStorage.getItem('users') || '[]');

    users = users.map(u => {
        if (u.email === currentUser.email) {
            // Senha atual incorreta
            if (u.password !== oldP) {
                alert('Senha atual incorreta');
                throw 'stop';
            }
            // Atualiza senha
            return { ...u, password: newP };
        }
        return u;
    });

    localStorage.setItem('users', JSON.stringify(users));
    alert('Senha alterada com sucesso');

    document.getElementById('formSenha').reset();
});


// ======================= FUNÇÕES AUXILIARES =======================

// Preenche o select de fornecedores na aba de compras
function atualizarSelectFornecedores() {
    const sel = document.getElementById("fornecedor");

    sel.innerHTML = `<option value="">Selecione um fornecedor</option>`;

    fornecedores.forEach(f => {
        sel.innerHTML += `<option value="${f.nome}">${f.nome}</option>`;
    });
}


// ======================= INICIALIZAR TUDO =======================

renderFornecedores();
atualizarSelectFornecedores();
renderCompras();
updateDashboard();
renderUsuarios();
