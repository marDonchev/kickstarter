import logo from "./logo.svg";
import "./scss/App.scss";
import { BrowserRouter, Route, Redirect } from "react-router-dom";

import store from "./AppStore";
import StoreContext from "./StoreContext";

import Test from "./components/Test";

console.info("store", store);

function App() {
    return (
        <StoreContext.Provider value={store}>
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <p className="shadow-2xl">
                        Edit <code>src/App.js</code> and save to reload.
                    </p>
                    <a
                        className="App-link"
                        href="https://reactjs.org"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Learn React
                    </a>
                    <Test />
                </header>
            </div>
        </StoreContext.Provider>
    );
}

export default App;
