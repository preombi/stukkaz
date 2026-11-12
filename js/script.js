
var produtos = [];
var movimentos = [];

var banco = supabase.createClient(
    'https://iwuqbqonrbapdipznisn.supabase.co',
    'sb_publishable_j6RtUjR7zCD8msSAcL-rdg_U5qwLYNg'
);

function salvarProdutos(tipo, produto, quantidade) {
    if (!produto.id) produto.id = 'produto-' + movimentos.length;
    var agora = new Date();
    movimentos.push({
        id: produto.id,
        codigo: produto.codigo,
        nome: produto.nome,
        tipo: tipo,
        quantidade: quantidade,
        data: dataLocal(agora),
        hora: agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})
    });
    atualizarDashboard();
}

async function adicionar() {
    var categoria = document.getElementById('adCategoria');
    var codigo = document.getElementById('adCodigo');
    var nome = document.getElementById('adNome');
    var preco = document.getElementById('adPreco');
    var quantidade = document.getElementById('adQuantidade');
    if (produtos.some(produto =>
        produto.codigo.trim().toLowerCase() === codigo.value.trim().toLowerCase()
    )) {
        window.alert('[ERRO] Já existe um produto cadastrado com este código!');
        codigo.focus();
        return;
    }
    if (categoria.value.length === 0 || codigo.value.length === 0 || nome.value.length === 0 || preco.value.length === 0 || quantidade.value.length === 0) {
        window.alert('[ERRO] Preencha os campos para continuar!')
    } else {
        if (!Number.isFinite(Number(preco.value)) || Number(preco.value) < 0 || !Number.isInteger(Number(quantidade.value)) || Number(quantidade.value) < 0) {
            window.alert('[ERRO] Verifique os dados e tente novamente!');
            return;
        }
        var resposta = await banco.from('produtos').insert({
            categoria: categoria.value,
            codigo: codigo.value.trim(),
            nome: nome.value.trim(),
            preco: Number(preco.value),
            quantidade: Number(quantidade.value)
            }).select().single();

        if (resposta.error) {
            window.alert('Erro ao cadastrar: ' + resposta.error.message);
            return;
        }
        var agora = new Date();

        var registro = await banco.from('movimentos').insert({
            produto_id: resposta.data.id,
            codigo: codigo.value.trim(),
            nome: nome.value.trim(),
            tipo: 'Cadastro',
            quantidade: Number(quantidade.value),
            data: dataLocal(agora),
            hora: agora.toTimeString().slice(0, 8)
        });
        if (registro.error) {
            window.alert('[ERRO] Não foi possível registrar movimentação: ' + registro.error.message);
        }

        await carregarEstoque();
        window.alert('Produto adicionado com sucesso!')
    }
    categoria.value = ''
    codigo.value = ''
    nome.value = ''
    preco.value = ''
    quantidade.value = ''
    categoria.focus()
}

function pesquisar() {
    var busca = document.getElementById('pesquisar').value.trim().toLowerCase();

    var tabela = document.getElementById('listaProdutos');
    tabela.replaceChildren();

    var encontrados = produtos.filter(produto => produto.nome.toLowerCase().includes(busca) || produto.codigo.toLowerCase().includes(busca));

    encontrados.forEach(produto => {
        var linha = tabela.insertRow();
        linha.insertCell().textContent = produto.codigo;
        linha.insertCell().textContent = produto.nome;
        linha.insertCell().textContent = produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        linha.insertCell().textContent = produto.quantidade;
        linha.insertCell().innerHTML = `<button onclick="editarProduto(${produtos.indexOf(produto)}, this)">Editar</button><button type="button" onclick="excluirProduto(${produtos.indexOf(produto)})">Excluir</button>`;
    });

    if (encontrados.length === 0) {
        var linha = tabela.insertRow();
        var celula = linha.insertCell();

        celula.colSpan = 5;
        celula.textContent = "Nenhum produto encontrado.";
    }
}

async function entrada() {
    var entradaCodigo = document.getElementById('entradaCodigo');
    var entradaQuantidade = document.getElementById('entradaQuantidade');

    var codEntrada = entradaCodigo.value.trim();
    var qtdEntrada = Number(entradaQuantidade.value);

    if (codEntrada === '' || !Number.isInteger(qtdEntrada) || qtdEntrada <= 0) {
        window.alert('[ERRO] Preencha os campos corretamente!');
        return;
    } else {
        var produto = produtos.find(item => item.codigo.toLowerCase() === codEntrada.toLowerCase());
    }
    if (!produto) {
        window.alert('[ERRO] O produto não foi encontrado! Faça o cadastro!')
        entradaCodigo.value = ''
        entradaQuantidade.value = ''
        entradaCodigo.focus();
        return;
    }
    var resposta = await banco.from('produtos')
    .update({quantidade: produto.quantidade + qtdEntrada})
    .eq('id', produto.id);

    if (resposta.error) return window.alert(resposta.error.message);

    var agora = new Date();
    var registro = await banco.from('movimentos').insert({
        produto_id: produto.id,
        codigo: produto.codigo,
        nome: produto.nome,
        tipo: 'Entrada',
        quantidade: qtdEntrada,
        data: dataLocal(agora),
        hora: agora.toTimeString().slice(0, 8)
    });

    if (registro.error) window.alert(registro.error.message);

    produto.quantidade += qtdEntrada;
    await carregarEstoque();

    window.alert(`A entrada do produto foi registrada. Estoque atualizado: ${produto.quantidade}`);

    entradaCodigo.value = ''
    entradaQuantidade.value = ''
    entradaCodigo.focus();

    pesquisar();
}

function menu() {
    var menu = document.querySelector('aside')
    menu.classList.toggle('btn')
}

function esconderOpc() {
    document.getElementById('adicionar').hidden = true;
    document.getElementById('pesquisarProduto').hidden = true;
    document.getElementById('entrada').hidden = true;
    document.getElementById('saida').hidden = true;

    if (window.innerWidth <= 600) {
        document.getElementById('aside').classList.add('btn');
    }
}

function mostrarInicio() {
    esconderOpc();
    document.getElementById('inicio').hidden = false;
    atualizarDashboard();
}

function mostrarAdicionar() {
    var secao = document.getElementById('adicionar');
    var escondida = secao.hidden;

    esconderOpc();
    secao.hidden = !escondida;
    document.getElementById('inicio').hidden = escondida;
    if (!escondida) atualizarDashboard();
}

function mostrarPesquisa() {
    var secao = document.getElementById('pesquisarProduto');
    var escondida = secao.hidden;

    esconderOpc();
    secao.hidden = !escondida;
    document.getElementById('inicio').hidden = escondida;
    if (!escondida) atualizarDashboard();

    if(!secao.hidden) {
        document.getElementById('pesquisar').value = '';
        pesquisar();
    }
}

function mostrarEntrada() {
    var secao = document.getElementById('entrada');
    var escondida = secao.hidden;

    esconderOpc();
    secao.hidden = !escondida;
    document.getElementById('inicio').hidden = escondida;
    if (!escondida) atualizarDashboard();
}

function mostrarSaida() {
    var secao = document.getElementById('saida');
    var escondida = secao.hidden;

    esconderOpc();
    secao.hidden = !escondida;
    document.getElementById('inicio').hidden = escondida;
    if (!escondida) atualizarDashboard();
}

async function saida() {
    var saidaCodigo = document.getElementById('saidaCodigo');
    var saidaQuantidade = document.getElementById('saidaQuantidade');

    var codSaida = saidaCodigo.value.trim();
    var qtdSaida = Number(saidaQuantidade.value);

    if (codSaida === '' || !Number.isInteger(qtdSaida) || qtdSaida <= 0) {
        window.alert('[ERRO] Preencha os campos corretamente!.');
        return;
    }

    var produto = produtos.find(item =>
        item.codigo.toLowerCase() === codSaida.toLowerCase()
    );

    if (!produto) {
        window.alert('[ERRO] Produto não encontrado.');
        saidaCodigo.value = '';
        saidaQuantidade.value = '';
        saidaCodigo.focus();
        return;
    }

    if (qtdSaida > Number(produto.quantidade)) {
        window.alert(`[ERRO] Estoque insuficiente! Disponível: ${produto.quantidade}`);
        return;
    }

    var resposta = await banco.from('produtos')
    .update({quantidade: produto.quantidade - qtdSaida})
    .eq('id', produto.id);

    if (resposta.error) return alert(resposta.error.message);

    produto.quantidade -= qtdSaida;

    var agora = new Date();
    var registro = await banco.from('movimentos').insert({
        produto_id: produto.id,
        codigo: produto.codigo,
        nome: produto.nome,
        tipo: 'Saída',
        quantidade: qtdSaida,
        data: dataLocal(agora),
        hora: agora.toTimeString().slice(0, 8)
    });
    if (registro.error) window.alert(registro.error.message);
    await carregarEstoque();

    window.alert(`Saída registrada! Estoque atual: ${produto.quantidade}`);

    saidaCodigo.value = '';
    saidaQuantidade.value = '';
    saidaCodigo.focus();

    pesquisar();
}

function atualizarTotal() {
    var atz = document.getElementsByClassName('totalProdutos')[0];
    var titulo = atz.querySelector('h3')

    titulo.innerHTML = `Total de produtos:<br><span class="destaqueEstoque">${produtos.length}</span>`;
}
atualizarTotal();

function atualizarUnidades() {
    var totalU = 0;

    for (var i=0;i<produtos.length;i++) {
        totalU += Number(produtos[i].quantidade);
    }
    var atzU = document.getElementsByClassName('estoqueUnidades')[0];
    var tituloUnidades = atzU.querySelector('h3');

    tituloUnidades.innerHTML = `Unidades em Estoque:<br><span class="destaqueEstoque">${totalU}</span>`
}
atualizarUnidades();

function atualizarEstoqueBaixo() {
    var nomes = []

    for (var i=0;i<produtos.length;i++) {
        if (Number(produtos[i].quantidade) <= 5) {
            nomes.push(produtos[i].nome);
        }
    }
    var tituloEstBx = document.getElementsByClassName('estoqueBaixo')[0];
    tituloEstBx.classList.toggle('alerta', nomes.length > 0);
    var titEst = tituloEstBx.querySelector('h3');

    var botao = document.getElementById('verMaisEstoque');
    if (nomes.length === 0) {
        titEst.innerHTML = 'Estoque baixo:<br>nenhum produto'
    } else {
        titEst.innerHTML = 'Estoque baixo:<br>';
        titEst.append(nomes.slice(0, 1).join(', '));
        if (nomes.length > 1) titEst.append('... ');
    }
    botao.hidden = nomes.length <= 1;
    botao.onclick = function () {
    window.alert('Outros produtos com estoque baixo:\n\n' + nomes.slice(1).join('\n'));
    };
}
atualizarEstoqueBaixo();

function atualizarValorEstoque() {
    var total = 0;

    for (var i=0;i<produtos.length;i++) {
        total += Number(produtos[i].preco) * Number(produtos[i].quantidade);
    }

    var atzV = document.getElementsByClassName('estoqueTotal')[0];
    var tituloValor = atzV.querySelector('h3');

    tituloValor.innerHTML = `Valor Total em Estoque:<br><span class="destaqueEstoque">${total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>`
}
atualizarValorEstoque();

async function excluirProduto(posicao) {
    if (!confirm('Deseja excluir esse produto?')) return;
    var produto = produtos[posicao];
    var resposta = await banco.from('produtos')
        .update({cadastrado: false})
        .eq('id', produto.id);

    if (resposta.error) return window.alert(resposta.error.message);

    var agora = new Date();
    await banco.from('movimentos').insert({
        produto_id: produto.id,
        codigo: produto.codigo,
        nome: produto.nome,
        tipo: 'Exclusão',
        quantidade: produto.quantidade,
        data: dataLocal(agora),
        hora: agora.toTimeString().slice(0, 8)
    });
    await carregarEstoque();
    pesquisar();
}

function editarProduto(pos, btn) {
    if (document.querySelector('.edit')) return;
    var linha = btn.closest('tr');
    linha.classList.add('edit');
    linha.cells[2].textContent = produtos[pos].preco;

    for(var i=0;i<4;i++) {
        linha.cells[i].contentEditable = 'true';
    }
    linha.cells[4].innerHTML = `<button onclick='salvarEdit(${pos})'>Salvar</button><button onclick='pesquisar()'>Cancelar</button>`;
    linha.cells[0].focus();
}

async function salvarEdit(pos) {
    var celulas = document.querySelector('.edit').cells;
    var codigo = celulas[0].textContent.trim();
    var nome = celulas[1].textContent.trim();
    var txtPreco = celulas[2].textContent.trim();
    var txtQuantidade = celulas[3].textContent.trim();
    var preco = Number(txtPreco.replace(',', '.'));
    var quantidade = Number(txtQuantidade);

    if (!codigo || !nome || !txtPreco || !txtQuantidade || !Number.isFinite(preco) || preco < 0 || !Number.isInteger(quantidade) || quantidade < 0) {
        window.alert('[ERRO] Verifique os dados e tente novamente!');
        return;
    }

    if (produtos.some((produto, i) => i !== pos && produto.codigo.trim().toLowerCase() === codigo.toLowerCase())) {
        window.alert('[ERRO] Este código já está cadastrado!');
        return;
    }

    var resposta = await banco.from('produtos')
    .update({codigo, nome, preco, quantidade})
    .eq('id', produtos[pos].id);

    if (resposta.error) return window.alert(resposta.error.message);
    var agora = new Date();

    await banco.from('movimentos').insert({
        produto_id: produtos[pos].id,
        codigo, nome, tipo: 'Edição', quantidade,
        data: dataLocal(agora),
        hora: agora.toTimeString().slice(0, 8)
    });

    await carregarEstoque();
    pesquisar();
    }

function dataLocal(data) {
    var mes = String(data.getMonth() + 1).padStart(2, '0');
    var dia = String(data.getDate()).padStart(2, '0');
    return data.getFullYear() + '-' + mes + '-' + dia;
}

var catgGraf;
var grafVendas;

function mostrarGrafRosc() {
    var categorias = {};

    for (var i = 0; i < produtos.length; i++) {
        var nome = produtos[i].categoria || 'Outros';
        if (nome === 'Escritorio') nome = 'Escritório';
        if (!categorias[nome]) categorias[nome] = 0;
        categorias[nome]++;
    }

    var estilo = getComputedStyle(document.getElementById('inicio'));
    var cores = estilo.getPropertyValue('--cores-rosca').trim().split(/\s+/);

    if (catgGraf) catgGraf.destroy();
    catgGraf = new Chart(document.getElementById('graficoCategorias'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(categorias),
            datasets: [{
                data: Object.values(categorias),
                backgroundColor: cores
            }]
        },
        options: { plugins: { legend: { position: estilo.getPropertyValue('--posicao-legenda').trim() || Chart.defaults.plugins.legend.position } } }
    });
}

function mostrarVendas() {
    if (typeof Chart === 'undefined') return;
    var mes = document.getElementById('mesVendas').value;
    var vendas = {};

    for (var i = 0; i < movimentos.length; i++) {
        var m = movimentos[i];
        if (m.tipo === 'Saída' && m.data.slice(0, 7) === mes) {
            if (!vendas[m.id]) vendas[m.id] = {nome: m.nome, total: 0};
            vendas[m.id].nome = m.nome;
            vendas[m.id].total += m.quantidade;
        }
    }

    var produtosVendidos = Object.values(vendas);
    produtosVendidos.sort((a, b) => b.total - a.total);

    var nomes = [];
    var quantidades = [];
    for (var i = 0; i < produtosVendidos.length && i < 5; i++) {
        nomes.push(produtosVendidos[i].nome);
        quantidades.push(produtosVendidos[i].total);
    }

    document.getElementById('semVendas').hidden = nomes.length > 0;
    var estilo = getComputedStyle(document.getElementById('inicio'));
    if (grafVendas) grafVendas.destroy();
    grafVendas = new Chart(document.getElementById('graficoVendas'), {
        type: 'bar',
        data: {
            labels: nomes,
            datasets: [{label: 'Unidades vendidas', data: quantidades, backgroundColor: estilo.getPropertyValue('--cor-colunas').trim()}]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

function mostrarHistorico() {
    var dia = document.getElementById('diaHistorico').value;
    var lista = document.getElementById('listaHistorico');
    lista.replaceChildren();
    for (var i = movimentos.length - 1; i >= 0; i--) {
        var m = movimentos[i];
        if (m.data !== dia) continue;
        var linha = document.createElement('li');
        linha.textContent = m.hora + ' · ' + m.tipo + ' · ' + m.nome + ' (' + m.codigo + ') · ' + m.quantidade + ' un.';
        lista.append(linha);
    }
    if (!lista.children.length) {
        var aviso = document.createElement('li');
        aviso.textContent = 'Nenhuma movimentação registrada neste dia.';
        lista.append(aviso);
    }
}

function atualizarDashboard() {
    if (document.getElementById('inicio').hidden) return;
    mostrarHistorico();
    document.getElementById('avisoGraficos').hidden = typeof Chart !== 'undefined';
    if (typeof Chart === 'undefined') return;

    var estilo = getComputedStyle(document.getElementById('graficoCategorias'));
    Chart.defaults.font.family = estilo.fontFamily;
    Chart.defaults.font.size = parseFloat(estilo.fontSize);
    Chart.defaults.color = estilo.color;
    mostrarGrafRosc();
    mostrarVendas();
}

async function carregarEstoque() {
    var sessao = await banco.auth.getSession();

    if (!sessao.data.session) {
        window.location.replace('login.html');
        return;
    }

    var listaPdr = await banco.from('produtos').select('*').eq('cadastrado', true).order('codigo');
    var listaMovi = await banco.from('movimentos').select('id:produto_id, codigo, nome, tipo, quantidade, data, hora').order('id');

    var erro = listaPdr.error || listaMovi.error;
    if (erro) {
        window.alert('Erro ao carregar o estoque: ' + erro.message);
        return;
    }

    produtos = listaPdr.data;
    movimentos = listaMovi.data;

    atualizarTotal();
    atualizarUnidades();
    atualizarEstoqueBaixo();
    atualizarValorEstoque();
    atualizarDashboard();
}

var hoje = dataLocal(new Date());
document.getElementById('mesVendas').value = hoje.slice(0, 7);
document.getElementById('diaHistorico').value = hoje;
carregarEstoque();
