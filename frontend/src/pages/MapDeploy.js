import React, { Component } from 'react';
import Eos from 'eosjs'; // https://github.com/EOSIO/eosjs
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import { withScriptjs, withGoogleMap, GoogleMap, Marker } from "react-google-maps"
import Modal from 'react-modal';
import io from 'socket.io-client';

import './App.css';
import 'bulma/css/bulma.css';
import axios from 'axios'

const socket = io('http://localhost:8000');
socket.on('connect', () => console.log("YOWWW"))


const accounts = [
  {"name":"useraaaaaaaa", "privateKey":"5K7mtrinTFrVTduSxizUc5hjXJEtTjVTsqSHeBHes1Viep86FP5", "publicKey":"EOS6kYgMTCh1iqpq9XGNQbEi8Q6k5GujefN9DSs55dcjVyFAq7B6b"},
  {"name":"useraaaaaaab", "privateKey":"5KLqT1UFxVnKRWkjvhFur4sECrPhciuUqsYRihc1p9rxhXQMZBg", "publicKey":"EOS78RuuHNgtmDv9jwAzhxZ9LmC6F295snyQ9eUDQ5YtVHJ1udE6p"},
  {"name":"useraaaaaaac", "privateKey":"5K2jun7wohStgiCDSDYjk3eteRH1KaxUQsZTEmTGPH4GS9vVFb7", "publicKey":"EOS5yd9aufDv7MqMquGcQdD6Bfmv6umqSuh9ru3kheDBqbi6vtJ58"},
  {"name":"useraaaaaaad", "privateKey":"5KNm1BgaopP9n5NqJDo9rbr49zJFWJTMJheLoLM5b7gjdhqAwCx", "publicKey":"EOS8LoJJUU3dhiFyJ5HmsMiAuNLGc6HMkxF4Etx6pxLRG7FU89x6X"},
  {"name":"useraaaaaaae", "privateKey":"5KE2UNPCZX5QepKcLpLXVCLdAw7dBfJFJnuCHhXUf61hPRMtUZg", "publicKey":"EOS7XPiPuL3jbgpfS3FFmjtXK62Th9n2WZdvJb6XLygAghfx1W7Nb"},
  {"name":"useraaaaaaaf", "privateKey":"5KaqYiQzKsXXXxVvrG8Q3ECZdQAj2hNcvCgGEubRvvq7CU3LySK", "publicKey":"EOS5btzHW33f9zbhkwjJTYsoyRzXUNstx1Da9X2nTzk8BQztxoP3H"},
  {"name":"useraaaaaaag", "privateKey":"5KFyaxQW8L6uXFB6wSgC44EsAbzC7ideyhhQ68tiYfdKQp69xKo", "publicKey":"EOS8Du668rSVDE3KkmhwKkmAyxdBd73B51FKE7SjkKe5YERBULMrw"}
];

const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
};

const MyMapComponent = withScriptjs(withGoogleMap((props) =>
  <GoogleMap
    defaultZoom={12.97}
    defaultCenter={{ lat: -19.6518018, lng: 147.4104647 }}
  >
    {props.isMarkerShown && <Marker position={{ lat: -19.625333, lng: 147.433828 }} />}
  </GoogleMap>
));

// actionData: {
//   _user: 'useraaaaaaae',
//     _health: '1',
//     _lat: '123',
//     _lng: '456'
// },



class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      color: 'rgb(127.5,127.5,0)',
      showMarker: false,
      results: {},
      noteTable: [],
      modalIsOpen: false,
      actionName: 'update',
      actionAccount: 'useraaaaaaae',
      actionData: {
        _user: 'useraaaaaaae',
        _note: 'IOT-DEVICE-1',
      },
      privateKey: '5KE2UNPCZX5QepKcLpLXVCLdAw7dBfJFJnuCHhXUf61hPRMtUZg'
    };
    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  componentDidMount() {
    socket.on('value', (e) => this._changeColor(e))
    this.getTable();
  }

  openModal() {
    this.setState({modalIsOpen: true});
  }

  _changeColor = (val) => {
    let g = 255;
    let r = 0;
    let num = val - 1000;
    if (num <= 6) {
      this.setState({ color: `rgb(${0},${255},0.0)` });
    } else if (num > 6 && num < 17) {
      g = 255 - (num-6)/11*255;
      r = (num-6)/6*255;
      this.setState({ color: `rgb(${r},${g},0.0)` });
    } else if (num >= 17) {
      this.setState({ color: `rgb(${255},${0},0.0)` })
    }


  };

  afterOpenModal() {
    // references are now sync'd and can be accessed.
    // this.subtitle.style.color = '#f00';
  }

  closeModal() {
    this.setState({modalIsOpen: false});
  }

  _sendRequest = async (event) => {

    // eosjs function call: connect to the blockchain
    const eos = Eos({keyProvider: this.state.privateKey});
    const result = await eos.transaction({
      actions: [{
        account: "notechainacc",
        name: "update",
        authorization: [{
          actor: this.state.actionAccount,
          permission: 'active',
        }],
        data: this.state.actionData,
      }],
    });

    console.log(result);
    this.getTable();
  }

  // gets table data from the blockchain
  // and saves it into the component state: "noteTable"
  getTable() {
    const eos = Eos();
    eos.getTableRows({
      "json": true,
      "code": "notechainacc",   // contract who owns the table
      "scope": "notechainacc",  // scope of the table
      "table": "notestruct",    // name of the table as specified by the contract abi
      "limit": 100,
    }).then(result => this.setState({ noteTable: result.rows }));
  }





  _deployDevice = () => {
    this.closeModal();
    this._sendRequest();
    this.setState({ showMarker: true })
  };


  render() {
    const { noteTable } = this.state;
    const generateCard = (key, timestamp, user, note) => (
      <Card className={'card'} key={key}>
        <CardContent>
          <Typography variant="headline" component="h2">
            {user}
          </Typography>
          <Typography style={{fontSize:12}} color="textSecondary" gutterBottom>
            {new Date(timestamp*1000).toString()}
          </Typography>
          <Typography component="pre">
            {note}
          </Typography>
          <div className="box" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, width: 120,}}>
            <div style={{height: 100, width: 100, backgroundColor: this.state.color}}></div>
          </div>
        </CardContent>
      </Card>
    );
    let noteCards = noteTable.map((row, i) =>
      generateCard(i, row.timestamp, row.user, row.note));

    return (
      <div className="container">
        <nav className="navbar is-transparent">
          <div className="navbar-brand">
            <a className="navbar-item" href="https://bulma.io">
              <h1 style={{fontSize: 40, fontWeight: 900, fontFamily: 'Arial'}}>PURIO</h1>
            </a>
            <div className="navbar-burger burger" data-target="navbarExampleTransparentExample">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <div id="navbarExampleTransparentExample" className="navbar-menu">
            <div className="navbar-start">
              <a className="navbar-item" href="https://bulma.io/">
                Home
              </a>
              <div className="navbar-item has-dropdown is-hoverable">
                <a className="navbar-link" href="/documentation/overview/start/">
                  Docs
                </a>
                <div className="navbar-dropdown is-boxed">
                  <a className="navbar-item" href="/documentation/overview/start/">
                    Overview
                  </a>
                  <a className="navbar-item" href="https://bulma.io/documentation/modifiers/syntax/">
                    Modifiers
                  </a>
                  <a className="navbar-item" href="https://bulma.io/documentation/columns/basics/">
                    Columns
                  </a>
                  <a className="navbar-item" href="https://bulma.io/documentation/layout/container/">
                    Layout
                  </a>
                  <a className="navbar-item" href="https://bulma.io/documentation/form/general/">
                    Form
                  </a>
                  <hr className="navbar-divider"/>
                  <a className="navbar-item" href="https://bulma.io/documentation/elements/box/">
                    Elements
                  </a>
                  <a className="navbar-item is-active" href="https://bulma.io/documentation/components/breadcrumb/">
                    Components
                  </a>
                </div>
              </div>
            </div>

            <div className="navbar-end">
              <div className="navbar-item">
                <div className="field is-grouped">
                  <p className="control">
                    <a className="bd-tw-button button" data-social-network="Twitter" data-social-action="tweet"
                       data-social-target="http://localhost:4000" target="_blank"
                       href="https://twitter.com/intent/tweet?text=Bulma: a modern CSS framework based on Flexbox&amp;hashtags=bulmaio&amp;url=http://localhost:4000&amp;via=jgthms">
              <span className="icon">
                <i className="fab fa-twitter"></i>
              </span>
                      <span>
                Tweet
              </span>
                    </a>
                  </p>
                  <p className="control">
                    <a className="button is-primary"
                       href="https://github.com/jgthms/bulma/releases/download/0.7.1/bulma-0.7.1.zip">
              <span className="icon">
                <i className="fas fa-download"></i>
              </span>
                      <span>Download</span>
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div className="container">
          <div className="field">
            <MyMapComponent
              isMarkerShown={this.state.showMarker}
              googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyA8xrZKKFJsEW35F4sjLg7vb2eAN2zU5Tk&v=3.exp&libraries=geometry,drawing,places"
              loadingElement={<div style={{ height: `100%` }} />}
              containerElement={<div style={{ height: `500px` }} />}
              mapElement={<div style={{ height: `100%` }} />}
            />
          </div>
        </div>
        <div className="container">
          {noteCards}
        </div>
        <div>
          <div className="field">
            <a onClick={this.openModal} className="button is-success" style={{marginTop: 10}}>Deploy IoT Device</a>
            <a onClick={this._sendRequest} className="button is-success" style={{marginTop: 10}}>Make request</a>
          </div>
          <Modal
            isOpen={this.state.modalIsOpen}
            onAfterOpen={this.afterOpenModal}
            onRequestClose={this.closeModal}
            style={customStyles}
            contentLabel="Example Modal"
          >
            <div className="container" style={{width: 500}}>
              <div className="field">

                <a onClick={this.closeModal} className="button is-focused">X</a>
              </div>
              <div className="field">
                <div className="control">
                  <input className="input is-primary" type="text" placeholder="Device name"/>
                </div>
              </div>
              <div className="field">
                <div className="control">
                  <a className="button is-link is-hovered" onClick={this._deployDevice}>Deploy</a>
                </div>
              </div>

            </div>

          </Modal>
        </div>
      </div>
    );
  }
}

export default App;
