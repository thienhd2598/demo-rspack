/*
 * Created by duydatpham@gmail.com on 18/05/2023
 * Copyright (c) 2023 duydatpham@gmail.com
 */
import React from "react";

class PrintButton extends React.PureComponent {
    state = {
        loading: false
    }

    componentWillMount() {
        this.isMouted = true
    }

    componentWillUnmount() {
        this.isMouted = false
    }


    removeWindow = (target) => {
        setTimeout(() => {
            target.parentNode.removeChild(target);
        }, 500);
    };

    _onClick = async () => {
        const { content_html } = this.props
        try {
            this.setState({ loading: true })
            if (!this.isMouted)
                return
            const printWindow = document.createElement("iframe");
            printWindow.style.position = "absolute";
            printWindow.style.top = "-1000px";
            printWindow.style.left = "-1000px";
            document.body.appendChild(printWindow);
            printWindow.onload = () => {
                console.log(`onLoad`)
            }

            const domDoc = printWindow.contentDocument || printWindow.contentWindow.document;
            domDoc.open();
            domDoc.write(`${content_html}`);
            domDoc.close();

            setTimeout(() => {
                printWindow.contentWindow.focus();
                printWindow.contentWindow.print();
                this.removeWindow(printWindow);
                this.setState({ loading: false })
            }, 500);
        } catch (error) {
            console.log(`error`, error)
            this.setState({ loading: false })
        }
    }

    render() {
        return (
            <a href="#" onClick={this._onClick} >Print</a>
        );
    }
}


export default PrintButton;
