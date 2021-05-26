import React, { Component } from "react";

import StoreContext from "./../StoreContext";

class Test extends Component {
    static contextType = StoreContext;
    STORE = null;

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount = () => {
        const STORE = this.context;
        console.info("STORE", STORE);
    };

    render() {
        return <h1>- Test -</h1>;
    }
}

export default Test;
