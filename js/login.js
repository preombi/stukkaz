var banco = supabase.createClient(
    'https://iwuqbqonrbapdipznisn.supabase.co',
    'sb_publishable_j6RtUjR7zCD8msSAcL-rdg_U5qwLYNg'
);

async function entrar() {
    var email = document.getElementById('emailLogin').value.trim();
    var senha = document.getElementById('senhaLogin').value;

    var resposta = await banco.auth.signInWithPassword({
        email: email,
        password: senha
    });

    if (resposta.error) {
        alert('Erro ao entrar: ' + resposta.error.message);
        return;
    }

    window.location.replace('index.html');
}