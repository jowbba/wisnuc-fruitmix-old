  /**
   * @module app
   * @description app main module
   * @time 2016-04-05 12:00
   * @author liuhua
   **/
   
//import core module
import React from 'react'
import { render } from 'react-dom'
import injectTapEventPlugin from 'react-tap-event-plugin'


// global import jQuery
global.$ = global.jQuery = global.jQuery || require('jquery')

var {ipcRenderer} = require('electron')
window.ipc = ipcRenderer

//import component
import Login  from'./components/login/Login'// login
import Main from './components/main/Main'//main

//import css
require('../assets/css/app.css')

//import store
import configureStore from './stores/store'

const store = configureStore()
injectTapEventPlugin()

window.c = console

window.onresize = function() {
	// store.dispatch({type:''})
}

window.mocha = false;

if (mocha) {
	window.dispatch = (action)=>{ipc.send('dispatch',action)}
}else {
	window.dispatch = (action)=>{store.dispatch(action)}
}

//APP component
var App = React.createClass({
	render: function(){
		console.log('render >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
		let state = store.getState()
		let isLogin = state.login.state == 'LOGGEDIN'?true:false
		return(
				<div className="app">	
						{/*<button onClick={this.save}>store</button>*/}
						<button onClick={this.save}>store</button>
						{isLogin && <Main state={state} dispatch={dispatch}/>}
						{!isLogin && <Login state={state} dispatch={dispatch}/>}	
						{/*<div onClick={this.submit}>submit>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>></div>*/}
				</div>
			)
	},

	save : function () {
		console.log('svae');
		ipc.send('store', store.getState());
	}
})

// define dom node
var appMountElement = document.getElementById('app')

//define render function
var Render = () =>{
	render(<App></App>,appMountElement)
};

//render
Render()

//subscribe store change
store.subscribe(()=>{
	Render()
})








