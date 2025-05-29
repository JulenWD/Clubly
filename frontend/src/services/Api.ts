const URL_BASE = 'http://localhost:3000';

export async function getEventos(idToken) {
    const res = await fetch(`${URL_BASE}/eventos`, {
        headers: {
            'Authorization': `Bearer ${idToken}`
        }
    })
    return res.json()
}

export async function getUsuarios(idToken) {
    const res = await fetch(`${URL_BASE}/usuarios`, {
        headers: {
            'Authorization': `Bearer ${idToken}`
        }
    })
    return res.json()
}

export async function createEvento(eventoData) {
    const res = await fetch(`${URL_BASE}/eventos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(eventoData)
    })
    return res.json()
}