import React from 'react';

const HelloWorld = () => {
    const handleClick = () => {
        alert('Hello World!');
    };

    return (
        <div>
            <h1>Hello World</h1>
            <button onClick={handleClick}>Click Me</button>
        </div>
    );
};

export default HelloWorld;