var produtos = [];
var movimentos = [];

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

function dataLocal(data) {
    var mes = String(data.getMonth() + 1).padStart(2, '0');
    var dia = String(data.getDate()).padStart(2, '0');
    return data.getFullYear() + '-' + mes + '-' + dia;
}

var hoje = dataLocal(new Date());
document.getElementById('mesVendas').value = hoje.slice(0, 7);
document.getElementById('diaHistorico').value = hoje;
carregarEstoque();

async function sair() {
    await banco.auth.signOut();
    window.location.replace('login.html');
}