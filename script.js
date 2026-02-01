async function carregarPagina(pagina) {
    const conteudo = document.getElementById("conteudo");

    try {
        // Construir URL absoluto para evitar problemas com caminhos relativos
        const url = new URL(`pages/${pagina}.html`, window.location.href).href;
        let resposta;
        try {
            resposta = await fetch(url);
        } catch (fetchError) {
            conteudo.innerHTML = `<h1>Erro</h1><p>Deu zica lendo o trêm.</p>`;
            console.error('Erro ao fazer fetch para', url, fetchError);
            return;
        }

        if (!resposta.ok) {
            conteudo.innerHTML = `<h1>Erro ${resposta.status}</h1><p>Não foi possível carregar a página (${resposta.statusText}).</p>`;
            console.error('Resposta não OK ao carregar', url, resposta.status, resposta.statusText);
            return;
        }

        const html = await resposta.text();
        conteudo.innerHTML = html;

        // Inicializar categorias e fornecedores quando suas páginas forem carregadas
        if (pagina === 'categorias') {
            inicializarCategorias();
            renderizarTabela();
        }

        if (pagina === 'fornecedores') {
            inicializarFornecedores();
            renderizarTabelaFornecedores();
        }

        if (pagina === 'lancamentos') {
            inicializarLancamentos();
            renderizarTabelaLancamentos();
        }

        if (pagina === 'movimentacoes') {
            renderizarTabelaMovimentacoes();
        }

    } catch (erro) {
        conteudo.innerHTML = "<h1>Erro</h1><p>Deu zica lendo o trêm.</p>";
        console.error("Num foi:", erro);
    }
}

// Carrega a página inicial quando o site abre
document.addEventListener('DOMContentLoaded', function() {
    carregarPagina('home');
});

// Variáveis de edição (mantidas no escopo global)
let idEmEdicao = null;
let idEmEdicaoFornecedor = null;

// ==================== FUNÇÕES PARA CRUD DE CATEGORIAS ====================

// Inicializa as categorias no localStorage se não existirem
function inicializarCategorias() {
    if (!localStorage.getItem('categorias')) {
        const categoriasIniciais = [];
        localStorage.setItem('categorias', JSON.stringify(categoriasIniciais));
        localStorage.setItem('proximoIdCategoria', '1');
    }
}

// Carrega as categorias do localStorage
function carregarCategorias() {
    const dados = localStorage.getItem('categorias');
    return dados ? JSON.parse(dados) : [];
}

// Salva as categorias no localStorage
function salvarCategorias(categorias) {
    localStorage.setItem('categorias', JSON.stringify(categorias));
}

// Obtém o próximo ID disponível
function obterProximoId() {
    let proximoId = parseInt(localStorage.getItem('proximoIdCategoria')) || 1;
    localStorage.setItem('proximoIdCategoria', (proximoId + 1).toString());
    return proximoId;
}

// Renderiza a tabela com as categorias
function renderizarTabela() {
    const categorias = carregarCategorias();
    const corpo = document.getElementById('corpoCategorias');
    const mensagem = document.getElementById('mensagemVazia');
    
    if (!corpo) return; // Página não está carregada

    corpo.innerHTML = '';

    if (categorias.length === 0) {
        if (mensagem) mensagem.style.display = 'block';
        return;
    }

    if (mensagem) mensagem.style.display = 'none';

    categorias.forEach(categoria => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${categoria.id}</td>
            <td>${categoria.nome}</td>
            <td><span class="badge badge-${categoria.tipo.toLowerCase()}">${categoria.tipo}</span></td>
            <td>
                <button class="btn btn-sm btn-edit" onclick="abrirModalEdicao(${categoria.id})">Editar</button>
                <button class="btn btn-sm btn-delete" onclick="deletarCategoria(${categoria.id})">Deletar</button>
            </td>
        `;
        corpo.appendChild(linha);
    });
}

// Adiciona uma nova categoria
function adicionarCategoria(event) {
    event.preventDefault();
    
    const nome = document.getElementById('inputNome').value.trim();
    const tipo = document.getElementById('selectTipo').value;

    // Validações
    if (!nome) {
        alert('O nome da categoria não pode estar vazio!');
        return;
    }

    if (!tipo) {
        alert('Selecione um tipo válido!');
        return;
    }

    // Carrega as categorias antes de validar duplicata
    const categorias = carregarCategorias();

    // Validar se já existe categoria com o mesmo nome
    if (categorias.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
        alert('Já existe uma categoria com este nome!');
        return;
    }

    // Criar nova categoria
    const novaCategoria = {
        id: obterProximoId(),
        nome: nome,
        tipo: tipo
    };

    // Adicionar à lista
    categorias.push(novaCategoria);
    salvarCategorias(categorias);

    // Limpar formulário
    document.getElementById('formCategoria').reset();

    // Atualizar tabela
    renderizarTabela();
}

// Abre o modal para editar uma categoria
function abrirModalEdicao(id) {
    const categorias = carregarCategorias();
    const categoria = categorias.find(c => c.id === id);

    if (!categoria) {
        alert('Categoria não encontrada!');
        return;
    }

    idEmEdicao = id;
    document.getElementById('editNome').value = categoria.nome;
    document.getElementById('editTipo').value = categoria.tipo;

    const modal = document.getElementById('modalEdicao');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Fecha o modal de edição
function fecharModalEdicao(event) {
    // Se clicar no backdrop (fora do modal), fecha
    if (event && event.target.id === 'modalEdicao') {
        const modal = document.getElementById('modalEdicao');
        if (modal) {
            modal.style.display = 'none';
        }
        idEmEdicao = null;
    }
    // Se clicar no botão X ou Cancelar
    else if (!event || event.target.classList.contains('modal-close') || event.target.textContent === 'Cancelar') {
        const modal = document.getElementById('modalEdicao');
        if (modal) {
            modal.style.display = 'none';
        }
        idEmEdicao = null;
    }
}

// Salva a edição de uma categoria
function salvarEdicao(event) {
    event.preventDefault();

    const nome = document.getElementById('editNome').value.trim();
    const tipo = document.getElementById('editTipo').value;

    // Validações
    if (!nome) {
        alert('O nome da categoria não pode estar vazio!');
        return;
    }

    if (!tipo) {
        alert('Selecione um tipo válido!');
        return;
    }

    // Atualizar categoria
    const categorias = carregarCategorias();
    const index = categorias.findIndex(c => c.id === idEmEdicao);

    if (index !== -1) {
        categorias[index].nome = nome;
        categorias[index].tipo = tipo;
        salvarCategorias(categorias);
    }

    // Fechar modal
    const modal = document.getElementById('modalEdicao');
    if (modal) {
        modal.style.display = 'none';
    }
    idEmEdicao = null;

    // Atualizar tabela
    renderizarTabela();
}

// Deleta uma categoria com confirmação
function deletarCategoria(id) {
    if (confirm('Tem certeza que deseja deletar esta categoria?')) {
        const categorias = carregarCategorias();
        const categoriasAtualizadas = categorias.filter(c => c.id !== id);
        salvarCategorias(categoriasAtualizadas);
        renderizarTabela();
    }
}

// ==================== FUNÇÕES PARA CRUD DE FORNECEDORES ====================

// Inicializa os fornecedores no localStorage se não existirem
function inicializarFornecedores() {
    if (!localStorage.getItem('fornecedores')) {
        localStorage.setItem('fornecedores', JSON.stringify([]));
        localStorage.setItem('proximoIdFornecedor', '1');
    }
}

// Carrega os fornecedores do localStorage
function carregarFornecedores() {
    const dados = localStorage.getItem('fornecedores');
    return dados ? JSON.parse(dados) : [];
}

// Salva os fornecedores no localStorage
function salvarFornecedores(fornecedores) {
    localStorage.setItem('fornecedores', JSON.stringify(fornecedores));
}

// Obtém o próximo ID disponível para fornecedor
function obterProximoIdFornecedor() {
    let proximoId = parseInt(localStorage.getItem('proximoIdFornecedor')) || 1;
    localStorage.setItem('proximoIdFornecedor', (proximoId + 1).toString());
    return proximoId;
}

// Renderiza a tabela com os fornecedores
function renderizarTabelaFornecedores() {
    const fornecedores = carregarFornecedores();
    const corpo = document.getElementById('corpoFornecedores');
    const mensagem = document.getElementById('mensagemVaziaFornecedores');
    
    if (!corpo) return; // Página não está carregada

    corpo.innerHTML = '';

    if (fornecedores.length === 0) {
        if (mensagem) mensagem.style.display = 'block';
        return;
    }

    if (mensagem) mensagem.style.display = 'none';

    fornecedores.forEach(f => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${f.id}</td>
            <td>${f.nome}</td>
            <td>
                <button class="btn btn-sm btn-edit" onclick="abrirModalEdicaoFornecedor(${f.id})">Editar</button>
                <button class="btn btn-sm btn-delete" onclick="deletarFornecedor(${f.id})">Deletar</button>
            </td>
        `;
        corpo.appendChild(linha);
    });
}

// Adiciona um novo fornecedor
function adicionarFornecedor(event) {
    event.preventDefault();

    const nome = document.getElementById('inputNomeFornecedor').value.trim();

    // Validações
    if (!nome) {
        alert('O nome do fornecedor não pode estar vazio!');
        return;
    }

    // Carrega os fornecedores antes de validar duplicata
    const fornecedores = carregarFornecedores();

    // Validar se já existe fornecedor com o mesmo nome
    if (fornecedores.some(f => f.nome.toLowerCase() === nome.toLowerCase())) {
        alert('Já existe um fornecedor com este nome!');
        return;
    }

    // Criar novo fornecedor
    const novoFornecedor = {
        id: obterProximoIdFornecedor(),
        nome: nome
    };

    // Adicionar à lista
    fornecedores.push(novoFornecedor);
    salvarFornecedores(fornecedores);

    // Limpar formulário
    document.getElementById('formFornecedor').reset();

    // Atualizar tabela
    renderizarTabelaFornecedores();
}

// Abre o modal para editar um fornecedor
function abrirModalEdicaoFornecedor(id) {
    const fornecedores = carregarFornecedores();
    const fornecedor = fornecedores.find(f => f.id === id);

    if (!fornecedor) {
        alert('Fornecedor não encontrado!');
        return;
    }

    idEmEdicaoFornecedor = id;
    document.getElementById('editNomeFornecedor').value = fornecedor.nome;

    const modal = document.getElementById('modalEdicaoFornecedor');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Fecha o modal de edição de fornecedor
function fecharModalEdicaoFornecedor(event) {
    // Se clicar no backdrop (fora do modal), fecha
    if (event && event.target.id === 'modalEdicaoFornecedor') {
        const modal = document.getElementById('modalEdicaoFornecedor');
        if (modal) {
            modal.style.display = 'none';
        }
        idEmEdicaoFornecedor = null;
    }
    // Se clicar no botão X ou Cancelar
    else if (!event || event.target.classList.contains('modal-close') || event.target.textContent === 'Cancelar') {
        const modal = document.getElementById('modalEdicaoFornecedor');
        if (modal) {
            modal.style.display = 'none';
        }
        idEmEdicaoFornecedor = null;
    }
}

// Salva a edição de um fornecedor
function salvarEdicaoFornecedor(event) {
    event.preventDefault();

    const nome = document.getElementById('editNomeFornecedor').value.trim();

    // Validações
    if (!nome) {
        alert('O nome do fornecedor não pode estar vazio!');
        return;
    }

    // Atualizar fornecedor
    const fornecedores = carregarFornecedores();
    const index = fornecedores.findIndex(f => f.id === idEmEdicaoFornecedor);

    if (index !== -1) {
        // Verificar duplicata (exceto o próprio registro)
        if (fornecedores.some((f, idx) => idx !== index && f.nome.toLowerCase() === nome.toLowerCase())) {
            alert('Já existe outro fornecedor com este nome!');
            return;
        }

        fornecedores[index].nome = nome;
        salvarFornecedores(fornecedores);
    }

    // Fechar modal
    const modal = document.getElementById('modalEdicaoFornecedor');
    if (modal) {
        modal.style.display = 'none';
    }
    idEmEdicaoFornecedor = null;

    // Atualizar tabela
    renderizarTabelaFornecedores();
}

// Deleta um fornecedor com confirmação
function deletarFornecedor(id) {
    if (confirm('Tem certeza que deseja deletar este fornecedor?')) {
        const fornecedores = carregarFornecedores();
        const fornecedoresAtualizados = fornecedores.filter(f => f.id !== id);
        salvarFornecedores(fornecedoresAtualizados);
        renderizarTabelaFornecedores();
    }
}

// ==================== FUNÇÕES PARA CRUD DE LANÇAMENTOS ====================

// Variável para rastrear ID em edição
let idEmEdicaoLancamento = null;

// Inicializa os lançamentos no localStorage se não existirem
function inicializarLancamentos() {
    if (!localStorage.getItem('lancamentos')) {
        localStorage.setItem('lancamentos', JSON.stringify([]));
        localStorage.setItem('proximoIdLancamento', '1');
    }
}

// Carrega os lançamentos do localStorage
function carregarLancamentos() {
    const dados = localStorage.getItem('lancamentos');
    return dados ? JSON.parse(dados) : [];
}

// Salva os lançamentos no localStorage
function salvarLancamentos(lancamentos) {
    localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
}

// Obtém o próximo ID disponível para lançamento
function obterProximoIdLancamento() {
    let proximoId = parseInt(localStorage.getItem('proximoIdLancamento')) || 1;
    localStorage.setItem('proximoIdLancamento', (proximoId + 1).toString());
    return proximoId;
}

// Obter nome da categoria por ID
function obterNomeCategoria(id) {
    const categorias = carregarCategorias();
    const categoria = categorias.find(c => c.id === id);
    return categoria ? categoria.nome : 'N/A';
}

// Obter nome do fornecedor por ID
function obterNomeFornecedor(id) {
    const fornecedores = carregarFornecedores();
    const fornecedor = fornecedores.find(f => f.id === id);
    return fornecedor ? fornecedor.nome : 'N/A';
}

// Renderiza a tabela com os lançamentos
function renderizarTabelaLancamentos() {
    const lancamentos = carregarLancamentos();
    const corpo = document.getElementById('corpoLancamentos');
    const mensagem = document.getElementById('mensagemVaziaLancamentos');
    
    if (!corpo) return; // Página não está carregada

    // Preencher combos de categoria e fornecedor
    preencherSelectsCategoriaFornecedor();

    corpo.innerHTML = '';

    if (lancamentos.length === 0) {
        if (mensagem) mensagem.style.display = 'block';
        return;
    }

    if (mensagem) mensagem.style.display = 'none';

    lancamentos.forEach(l => {
        const linha = document.createElement('tr');
        const badgeStatus = l.status === 'Ativo' ? 'badge-receita' : 'badge-despesa';
        linha.innerHTML = `
            <td>${l.id}</td>
            <td>R$ ${parseFloat(l.valorBruto).toFixed(2)}</td>
            <td><span class="badge ${badgeStatus}">${l.status}</span></td>
            <td>${new Date(l.dataLancamento).toLocaleDateString('pt-BR')}</td>
            <td>${formatarRecorrencia(l)}</td>
            <td>${obterNomeCategoria(l.categoriaId)}</td>
            <td>${obterNomeFornecedor(l.fornecedorId)}</td>
            <td>
                <button class="btn btn-sm btn-edit" onclick="abrirModalEdicaoLancamento(${l.id})">Editar</button>
                <button class="btn btn-sm btn-delete" onclick="deletarLancamento(${l.id})">Deletar</button>
            </td>
        `;
        corpo.appendChild(linha);
    });
}

// Formatar a descrição da recorrência para exibição
function formatarRecorrencia(lancamento) {
    const tipo = lancamento.recorrenciaTipo || 'avulso';
    const count = lancamento.recorrenciaCount;
    if (tipo === 'avulso') return 'Avulso';
    if (tipo === 'parcelado') return count ? `Parcelado (${count}x)` : 'Parcelado';
    if (tipo === 'recorrente') return count ? `Recorrente (${count}x)` : 'Recorrente (mensal)';
    return 'Avulso';
}

// Adiciona um novo lançamento
function adicionarLancamento(event) {
    event.preventDefault();

    const valorBruto = parseFloat(document.getElementById('inputValorBruto').value);
    const status = document.getElementById('selectStatus').value;
    const dataLancamento = document.getElementById('inputDataLancamento').value;
    const categoriaId = parseInt(document.getElementById('selectCategoria').value);
    const fornecedorId = parseInt(document.getElementById('selectFornecedor').value);
    const recorrenciaTipo = document.getElementById('selectRecorrencia') ? document.getElementById('selectRecorrencia').value : 'avulso';
    const recorrenciasVal = document.getElementById('inputRecorrencias') ? document.getElementById('inputRecorrencias').value : '';
    const recorrenciaCount = recorrenciasVal ? parseInt(recorrenciasVal) : null;

    // Validações
    if (!valorBruto || valorBruto <= 0) {
        alert('O valor bruto deve ser maior que zero!');
        return;
    }

    if (!status) {
        alert('Selecione um status!');
        return;
    }

    if (!dataLancamento) {
        alert('Selecione a data de lançamento!');
        return;
    }

    // dataLancamento é obrigatória já validada mais acima

    if (!categoriaId) {
        alert('Selecione uma categoria!');
        return;
    }

    if (!fornecedorId) {
        alert('Selecione um fornecedor!');
        return;
    }

    // Criar novo lançamento
    const novoLancamento = {
        id: obterProximoIdLancamento(),
        valorBruto: valorBruto,
        status: status,
        dataLancamento: dataLancamento,
        recorrenciaTipo: recorrenciaTipo,
        recorrenciaCount: recorrenciaCount,
        categoriaId: categoriaId,
        fornecedorId: fornecedorId
    };

    // Adicionar à lista
    const lancamentos = carregarLancamentos();
    lancamentos.push(novoLancamento);
    salvarLancamentos(lancamentos);

    // Limpar formulário
    document.getElementById('formLancamento').reset();
    if (document.getElementById('grupoRecorrencia')) {
        document.getElementById('grupoRecorrencia').style.display = 'none';
    }
    if (document.getElementById('inputRecorrencias')) {
        document.getElementById('inputRecorrencias').value = '';
    }

    // Atualizar tabela
    renderizarTabelaLancamentos();
}

// Abre o modal para editar um lançamento
function abrirModalEdicaoLancamento(id) {
    const lancamentos = carregarLancamentos();
    const lancamento = lancamentos.find(l => l.id === id);

    if (!lancamento) {
        alert('Lançamento não encontrado!');
        return;
    }

    idEmEdicaoLancamento = id;
    
    // Preencher selects primeiro (popula as opções)
    preencherSelectsCategoriaFornecedor();

    // Preencher campos
    const titulo = document.getElementById('modalTituloLancamento');
    if (titulo) titulo.textContent = 'Editar Lançamento';
    document.getElementById('editValorBruto').value = lancamento.valorBruto;
    const statusCheckbox = document.getElementById('editStatus');
    if (statusCheckbox) statusCheckbox.checked = lancamento.status === 'Ativo';
    document.getElementById('editDataLancamento').value = lancamento.dataLancamento || '';
    // Setar categoria e fornecedor DEPOIS que as opções estão preenchidas
    document.getElementById('editCategoria').value = lancamento.categoriaId;
    document.getElementById('editFornecedor').value = lancamento.fornecedorId;
    // Preencher recorrência
    if (document.getElementById('editRecorrencia')) {
        document.getElementById('editRecorrencia').value = lancamento.recorrenciaTipo || 'avulso';
    }
    if (document.getElementById('editRecorrencias')) {
        document.getElementById('editRecorrencias').value = lancamento.recorrenciaCount || '';
    }

    // Mostrar/esconder campos de recorrência no modal
    if (typeof atualizarVisibilidadeRecorrenciaModal === 'function') atualizarVisibilidadeRecorrenciaModal();

    const modal = document.getElementById('modalEdicaoLancamento');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Fecha o modal de edição de lançamento
function fecharModalEdicaoLancamento(event) {
    // Se clicar no backdrop (fora do modal), fecha
    if (event && event.target.id === 'modalEdicaoLancamento') {
        const modal = document.getElementById('modalEdicaoLancamento');
        if (modal) {
            modal.style.display = 'none';
        }
        idEmEdicaoLancamento = null;
    }
    // Se clicar no botão X ou Cancelar
    else if (!event || event.target.classList.contains('modal-close') || event.target.textContent === 'Cancelar') {
        const modal = document.getElementById('modalEdicaoLancamento');
        if (modal) {
            modal.style.display = 'none';
        }
        idEmEdicaoLancamento = null;
    }
}

function abrirModalNovoLancamento() {
    idEmEdicaoLancamento = null;
    const titulo = document.getElementById('modalTituloLancamento');
    if (titulo) titulo.textContent = 'Adicionar Lançamento';

    // Limpar/resetar campos do modal
    if (document.getElementById('editValorBruto')) document.getElementById('editValorBruto').value = '';
    if (document.getElementById('editStatus')) document.getElementById('editStatus').checked = true; // Ativo por padrão
    // Setar data de lançamento como hoje
    if (document.getElementById('editDataLancamento')) {
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('editDataLancamento').value = hoje;
    }
    if (document.getElementById('editCategoria')) document.getElementById('editCategoria').value = '';
    if (document.getElementById('editFornecedor')) document.getElementById('editFornecedor').value = '';
    if (document.getElementById('editRecorrencia')) document.getElementById('editRecorrencia').value = 'parcelado';
    if (document.getElementById('editRecorrencias')) document.getElementById('editRecorrencias').value = '';

    preencherSelectsCategoriaFornecedor();
    if (typeof atualizarVisibilidadeRecorrenciaModal === 'function') atualizarVisibilidadeRecorrenciaModal();

    const modal = document.getElementById('modalEdicaoLancamento');
    if (modal) modal.style.display = 'flex';
}

// Salva a edição de um lançamento (ou cria se for novo)
function salvarEdicaoLancamento(event) {
    event.preventDefault();

    const valorBruto = parseFloat(document.getElementById('editValorBruto').value);
    const isAtivo = document.getElementById('editStatus').checked;
    const status = isAtivo ? 'Ativo' : 'Inativo';
    const dataLancamento = document.getElementById('editDataLancamento').value;
    const categoriaId = parseInt(document.getElementById('editCategoria').value);
    const fornecedorId = parseInt(document.getElementById('editFornecedor').value);

    // Validações
    if (!valorBruto || valorBruto <= 0) {
        alert('O valor bruto deve ser maior que zero!');
        return;
    }

    // sem data de pagamento no fluxo atual

    // Atualizar lançamento
    const lancamentos = carregarLancamentos();
    const index = lancamentos.findIndex(l => l.id === idEmEdicaoLancamento);

    const editRecorrenciaTipo = document.getElementById('editRecorrencia') ? document.getElementById('editRecorrencia').value : 'avulso';
    const editRecorrenciasVal = document.getElementById('editRecorrencias') ? document.getElementById('editRecorrencias').value : '';
    const editRecorrenciaCount = editRecorrenciasVal ? parseInt(editRecorrenciasVal) : null;

    if (index !== -1) {
        lancamentos[index].valorBruto = valorBruto;
        lancamentos[index].status = status;
        lancamentos[index].dataLancamento = dataLancamento;
        lancamentos[index].recorrenciaTipo = editRecorrenciaTipo;
        lancamentos[index].recorrenciaCount = editRecorrenciaCount;
        lancamentos[index].categoriaId = categoriaId;
        lancamentos[index].fornecedorId = fornecedorId;
        salvarLancamentos(lancamentos);
    } else {
        // criar novo
        const novoLancamento = {
            id: obterProximoIdLancamento(),
            valorBruto: valorBruto,
            status: status,
            dataLancamento: dataLancamento,
            recorrenciaTipo: editRecorrenciaTipo,
            recorrenciaCount: editRecorrenciaCount,
            categoriaId: categoriaId,
            fornecedorId: fornecedorId
        };
        lancamentos.push(novoLancamento);
        salvarLancamentos(lancamentos);
    }

    // Fechar modal
    const modal = document.getElementById('modalEdicaoLancamento');
    if (modal) {
        modal.style.display = 'none';
    }
    idEmEdicaoLancamento = null;

    // Atualizar tabela
    renderizarTabelaLancamentos();
}

// Deleta um lançamento com confirmação
function deletarLancamento(id) {
    if (confirm('Tem certeza que deseja deletar este lançamento?')) {
        const lancamentos = carregarLancamentos();
        const lancamentosAtualizados = lancamentos.filter(l => l.id !== id);
        salvarLancamentos(lancamentosAtualizados);
        renderizarTabelaLancamentos();
    }
}

// Preencher selects de categoria e fornecedor
function preencherSelectsCategoriaFornecedor() {
    const categorias = carregarCategorias();
    const fornecedores = carregarFornecedores();

    const selectCategoria = document.getElementById('selectCategoria');
    const editCategoria = document.getElementById('editCategoria');
    
    [selectCategoria, editCategoria].forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="">-- Selecione uma categoria --</option>';
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nome;
            select.appendChild(option);
        });
    });

    const selectFornecedor = document.getElementById('selectFornecedor');
    const editFornecedor = document.getElementById('editFornecedor');
    
    [selectFornecedor, editFornecedor].forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="">-- Selecione um fornecedor --</option>';
        fornecedores.forEach(f => {
            const option = document.createElement('option');
            option.value = f.id;
            option.textContent = f.nome;
            select.appendChild(option);
        });
    });
}

// Mostrar/esconder campos de recorrência (disponível globalmente porque este arquivo é carregado uma vez)
function atualizarVisibilidadeRecorrencia() {
    const tipoEl = document.getElementById('selectRecorrencia');
    if (!tipoEl) return;
    const tipo = tipoEl.value;
    const grupo = document.getElementById('grupoRecorrencia');
    const input = document.getElementById('inputRecorrencias');
    const label = document.querySelector('label[for="inputRecorrencias"]');
    if (tipo === 'parcelado') {
        if (grupo) grupo.style.display = 'block';
        if (input) input.required = true;
        if (label) label.textContent = 'Quantidade de parcelas:';
    } else if (tipo === 'recorrente') {
        if (grupo) grupo.style.display = 'block';
        if (input) input.required = false;
        if (label) label.textContent = 'Número de meses (opcional):';
    } else {
        if (grupo) grupo.style.display = 'none';
        if (input) { input.required = false; input.value = ''; }
        if (label) label.textContent = 'Número de vezes (deixe vazio para repetir indefinidamente):';
    }
}

function atualizarVisibilidadeRecorrenciaModal() {
    const tipoEl = document.getElementById('editRecorrencia');
    if (!tipoEl) return;
    const tipo = tipoEl.value;
    const grupo = document.getElementById('grupoEditRecorrencia');
    const input = document.getElementById('editRecorrencias');
    const label = document.querySelector('label[for="editRecorrencias"]');
    if (tipo === 'parcelado') {
        if (grupo) grupo.style.display = 'block';
        if (input) input.required = true;
        if (label) label.textContent = 'Quantidade de parcelas:';
    } else if (tipo === 'recorrente') {
        if (grupo) grupo.style.display = 'block';
        if (input) input.required = false;
        if (label) label.textContent = 'Número de meses (opcional):';
    } else {
        if (grupo) grupo.style.display = 'none';
        if (input) { input.required = false; input.value = ''; }
        if (label) label.textContent = 'Número de vezes (deixe vazio para repetir indefinidamente):';
    }
}

// ==================== MOVIMENTAÇÕES ====================

// Carregar movimentações do localStorage
function carregarMovimentacoes() {
    const data = localStorage.getItem('movimentacoes');
    return data ? JSON.parse(data) : [];
}

// Salvar movimentações no localStorage
function salvarMovimentacoes(movimentacoes) {
    localStorage.setItem('movimentacoes', JSON.stringify(movimentacoes));
}

// Carregar itens de movimentação do localStorage
function carregarItensMovimentacao() {
    const data = localStorage.getItem('itensMovimentacao');
    return data ? JSON.parse(data) : [];
}

// Salvar itens de movimentação no localStorage
function salvarItensMovimentacao(itens) {
    localStorage.setItem('itensMovimentacao', JSON.stringify(itens));
}

// Gerar ID único para movimentação
function gerarIdMovimentacao() {
    const movimentacoes = carregarMovimentacoes();
    return movimentacoes.length > 0 ? Math.max(...movimentacoes.map(m => m.id)) + 1 : 1;
}

// Gerar ID único para item de movimentação
function gerarIdItemMovimentacao() {
    const itens = carregarItensMovimentacao();
    return itens.length > 0 ? Math.max(...itens.map(i => i.id)) + 1 : 1;
}

// Renderizar tabela de movimentações
function renderizarTabelaMovimentacoes() {
    const movimentacoes = carregarMovimentacoes();
    const tbody = document.getElementById('corpoTabelaMovimentacoes');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';

    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    movimentacoes.forEach(mov => {
        const linha = document.createElement('tr');
        
        const receitas = calcularTotalReceitas(mov.id);
        const despesas = calcularTotalDespesas(mov.id);
        const saldo = receitas - despesas;
        
        const badgeStatus = mov.status === 'Aberto' ? 'badge-receita' : 'badge-despesa';
        
        linha.innerHTML = `
            <td>${meses[mov.mes - 1]} / ${mov.ano}</td>
            <td><span class="badge ${badgeStatus}">${mov.status}</span></td>
            <td style="color: #4CAF50; font-weight: bold;">R$ ${receitas.toFixed(2)}</td>
            <td style="color: #f44336; font-weight: bold;">R$ ${despesas.toFixed(2)}</td>
            <td style="font-weight: bold; color: #2196F3;">R$ ${saldo.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="abrirModalEdicaoMovimentacao(${mov.id})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deletarMovimentacao(${mov.id})">Deletar</button>
            </td>
        `;
        
        tbody.appendChild(linha);
    });
}

// Calcular total de receitas para uma movimentação
function calcularTotalReceitas(movimentacaoId) {
    const itens = carregarItensMovimentacao();
    const categorias = carregarCategorias();
    
    return itens
        .filter(item => item.movimentacaoId === movimentacaoId)
        .reduce((total, item) => {
            const lancamento = carregarLancamentos().find(l => l.id === item.idLancamento);
            const categoria = categorias.find(c => c.id === lancamento?.categoriaId);
            if (categoria && categoria.tipo === 'Receita') {
                const valorLiquido = item.valorLiquido || lancamento.valorBruto;
                return total + valorLiquido;
            }
            return total;
        }, 0);
}

// Calcular total de despesas para uma movimentação
function calcularTotalDespesas(movimentacaoId) {
    const itens = carregarItensMovimentacao();
    const categorias = carregarCategorias();
    
    return itens
        .filter(item => item.movimentacaoId === movimentacaoId)
        .reduce((total, item) => {
            const lancamento = carregarLancamentos().find(l => l.id === item.idLancamento);
            const categoria = categorias.find(c => c.id === lancamento?.categoriaId);
            if (categoria && categoria.tipo === 'Despesa') {
                const valorLiquido = item.valorLiquido || lancamento.valorBruto;
                return total + valorLiquido;
            }
            return total;
        }, 0);
}

let movimentacaoEmEdicao = null;

// Abrir modal para nova movimentação
function abrirModalNovaMovimentacao() {
    const hoje = new Date();
    document.getElementById('novaMovMes').value = '';
    document.getElementById('novaMovAno').value = '';
    
    const modal = document.getElementById('modalNovaMovimentacao');
    if (modal) modal.style.display = 'flex';
}

// Fechar modal de nova movimentação
function fecharModalNovaMovimentacao(event) {
    if (event && event.target.id !== 'modalNovaMovimentacao') return;
    
    const modal = document.getElementById('modalNovaMovimentacao');
    if (modal) modal.style.display = 'none';
}

// Salvar nova movimentação
function salvarNovaMovimentacao(event) {
    event.preventDefault();
    
    const mes = parseInt(document.getElementById('novaMovMes').value);
    const ano = parseInt(document.getElementById('novaMovAno').value);
    
    if (!mes || !ano) {
        alert('Informe mês e ano!');
        return;
    }
    
    // Verificar se já existe movimentação para este mês
    const movimentacoes = carregarMovimentacoes();
    if (movimentacoes.some(m => m.mes === mes && m.ano === ano)) {
        alert('Já existe uma movimentação para este mês!');
        return;
    }
    
    const novaMovimentacao = {
        id: gerarIdMovimentacao(),
        mes: mes,
        ano: ano,
        status: 'Aberto'
    };
    
    movimentacoes.push(novaMovimentacao);
    salvarMovimentacoes(movimentacoes);
    
    // Vinculação automática de lançamentos do mês
    vincularLancamentosAoMes(novaMovimentacao.id, mes, ano);
    
    renderizarTabelaMovimentacoes();
    fecharModalNovaMovimentacao();
    alert('Movimentação criada com sucesso!');
}

// Vincular lançamentos ao mês automaticamente
function vincularLancamentosAoMes(movimentacaoId, mes, ano) {
    const lancamentos = carregarLancamentos();
    const itens = carregarItensMovimentacao();
    
    lancamentos.forEach(lancamento => {
        const dataLancamento = new Date(lancamento.dataLancamento);
        if (dataLancamento.getMonth() + 1 === mes && dataLancamento.getFullYear() === ano) {
            const novoItem = {
                id: gerarIdItemMovimentacao(),
                movimentacaoId: movimentacaoId,
                idLancamento: lancamento.id,
                desconto: 0,
                acrescimo: 0,
                valorLiquido: lancamento.valorBruto,
                status: 'Pendente',
                dataVencimento: lancamento.dataLancamento,
                dataPagamento: null,
                observacoes: ''
            };
            itens.push(novoItem);
        }
    });
    
    salvarItensMovimentacao(itens);
}

// Abrir modal para editar movimentação
function abrirModalEdicaoMovimentacao(movimentacaoId) {
    const movimentacoes = carregarMovimentacoes();
    const movimentacao = movimentacoes.find(m => m.id === movimentacaoId);
    
    if (!movimentacao) {
        alert('Movimentação não encontrada!');
        return;
    }
    
    movimentacaoEmEdicao = movimentacaoId;
    
    const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const titulo = document.getElementById('modalTituloEdicaoMovimentacao');
    if (titulo) titulo.textContent = `${meses[movimentacao.mes]} / ${movimentacao.ano}`;
    
    document.getElementById('editStatusMovimentacao').value = movimentacao.status;
    
    atualizarTotaisMovimentacao(movimentacaoId);
    renderizarLancamentosMovimentacao(movimentacaoId);
    
    const modal = document.getElementById('modalEdicaoMovimentacao');
    if (modal) modal.style.display = 'flex';
}

// Fechar modal de edição de movimentação
function fecharModalEdicaoMovimentacao(event) {
    if (event && event.target.id !== 'modalEdicaoMovimentacao') return;
    
    const modal = document.getElementById('modalEdicaoMovimentacao');
    if (modal) modal.style.display = 'none';
    movimentacaoEmEdicao = null;
}

// Atualizar totais na movimentação
function atualizarTotaisMovimentacao(movimentacaoId) {
    const receitas = calcularTotalReceitas(movimentacaoId);
    const despesas = calcularTotalDespesas(movimentacaoId);
    const saldo = receitas - despesas;
    
    document.getElementById('totalReceitas').textContent = `R$ ${receitas.toFixed(2)}`;
    document.getElementById('totalDespesas').textContent = `R$ ${despesas.toFixed(2)}`;
    document.getElementById('saldoFinal').textContent = `R$ ${saldo.toFixed(2)}`;
    document.getElementById('saldoFinal').style.color = saldo >= 0 ? '#4CAF50' : '#f44336';
}

// Renderizar lançamentos da movimentação
function renderizarLancamentosMovimentacao(movimentacaoId) {
    const itens = carregarItensMovimentacao();
    const lancamentos = carregarLancamentos();
    const fornecedores = carregarFornecedores();
    const tbody = document.getElementById('corpoTabelaLancamentosMovimentacao');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const itensMes = itens.filter(item => item.movimentacaoId === movimentacaoId);
    
    itensMes.forEach(item => {
        const lancamento = lancamentos.find(l => l.id === item.idLancamento);
        const fornecedor = fornecedores.find(f => f.id === lancamento?.fornecedorId);
        const categoria = carregarCategorias().find(c => c.id === lancamento?.categoriaId);
        
        if (!lancamento) return;
        
        const linha = document.createElement('tr');
        const badgeStatus = item.status === 'Pago' ? 'badge-receita' : 'badge-despesa';
        
        linha.innerHTML = `
            <td>${fornecedor?.nome || 'N/A'}</td>
            <td>R$ ${lancamento.valorBruto.toFixed(2)}</td>
            <td>${categoria?.nome || 'N/A'}</td>
            <td>${fornecedor?.nome || 'N/A'}</td>
            <td>${item.dataVencimento}</td>
            <td><span class="badge ${badgeStatus}">${item.status}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="editarItemMovimentacao(${item.id})">Editar</button>
            </td>
        `;
        
        tbody.appendChild(linha);
    });
}

// Editar item de movimentação (lançamento)
function editarItemMovimentacao(itemId) {
    // Implementar modal de edição do item
    alert('Edição de item de movimentação em desenvolvimento');
}

// Salvar status da movimentação
function salvarStatusMovimentacao() {
    if (!movimentacaoEmEdicao) return;
    
    const novoStatus = document.getElementById('editStatusMovimentacao').value;
    const movimentacoes = carregarMovimentacoes();
    const movimentacao = movimentacoes.find(m => m.id === movimentacaoEmEdicao);
    
    if (movimentacao) {
        movimentacao.status = novoStatus;
        salvarMovimentacoes(movimentacoes);
        renderizarTabelaMovimentacoes();
        fecharModalEdicaoMovimentacao();
        alert('Status da movimentação atualizado com sucesso!');
    }
}

// Deletar movimentação
function deletarMovimentacao(movimentacaoId) {
    if (!confirm('Tem certeza que deseja deletar esta movimentação?')) return;
    
    let movimentacoes = carregarMovimentacoes();
    movimentacoes = movimentacoes.filter(m => m.id !== movimentacaoId);
    salvarMovimentacoes(movimentacoes);
    
    // Deletar itens da movimentação
    let itens = carregarItensMovimentacao();
    itens = itens.filter(item => item.movimentacaoId !== movimentacaoId);
    salvarItensMovimentacao(itens);
    
    renderizarTabelaMovimentacoes();
}

