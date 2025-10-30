import React, { useState } from 'react';

function Counter() {
    const [count, setCount] = useState(0);
    return (
        <div>
            <p>Você clicou {count} vezes</p>
            <button OnClick={() => setCount(count + 1)}>
                Clique aqui
            </button>
        </div>
    )
}