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

