var banco = supabase.createClient(
    'https://iwuqbqonrbapdipznisn.supabase.co',
    'sb_publishable_j6RtUjR7zCD8msSAcL-rdg_U5qwLYNg'
);

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

