import React, { PureComponent } from 'react'

import { TextField } from 'material-ui'
import SocialPerson from 'material-ui/svg-icons/social/person'
import CommunicationVpnKey from 'material-ui/svg-icons/communication/vpn-key'

import FlatButton from '../common/FlatButton'
import IconBox from '../common/IconBox'

class NewUserDialog extends PureComponent {

  constructor(props) {
    
    super(props)
    this.state = { 
      focusFirst: true,
      username: '',
      password: '',
      passwordAgain: '',
      message: '',
      usernameErrorText:'',
      passwordErrorText:'',
      passwordAgainErrorText:''
    }

    this.fire = () => {
      let apis = this.props.apis
      apis.request('adminCreateUser', {
        username: this.state.username,
        password: this.state.password
      }, err => {
        if (!err) {
          this.props.onRequestClose(true)
          this.props.refreshUsers('adminUsers')
        }
      })
    }
  }

  updateUsername(text) {
    this.setState({ username: text })
    if (text.length === 0)
      this.setState({ usernameErrorText: '用户名不能为空' })
    else if (this.props.apis.adminUsers.data.users.every(u => u.username !== text))
      this.setState({ usernameErrorText: '' })
    else 
      this.setState({ usernameErrorText: '用户名已存在' })
  }

  updatePassword(text) {
    this.setState({ password: text })
    if (text.length === 0)
      this.setState({ passwordErrorText: '密码不能为空' })
    else 
      this.setState({ passwordErrorText: '' })
  }

  updatePasswordAgain(text) {
    this.setState({ passwordAgain: text })
    if (text !== this.state.password)
      this.setState({ passwordAgainErrorText: '两次密码不一致' })
    else
      this.setState({ passwordAgainErrorText: '' })
  }

  inputOK() {
    return this.state.username.length > 0
      && this.state.password.length > 0
      && this.state.password === this.state.passwordAgain 
  }

  render() {
    return (
      <div style={{width: 336, padding: '24px 24px 0px 24px'}}>
        <div style={{fontSize: 20, fontWeight: 500, color: 'rgba(0,0,0,0.87)'}}>新用户</div>
        <div style={{height: 56, 
          display: 'flex', alignItems: 'center',
          fontSize: 16, color: 'rgba(0,0,0,0.54)'}}>
          { this.state.message }
        </div>

        <div style={{height: 56, display: 'flex', marginBottom:10}}>
          <IconBox style={{marginLeft: -12}} size={48} icon={SocialPerson} />
          <TextField 
            fullWidth={true} 
            hintText="用户名" 
            maxLength={16}
            errorText={this.state.usernameErrorText}
            onChange={e => this.updateUsername(e.target.value)} 
            ref={input => {
              if (input && this.state.focusFirst) {
                input.focus()
                this.setState({ focusFirst: false })
              }
            }}
          />
        </div>

        <div style={{height: 56, display: 'flex', marginBottom:10}}>
          <IconBox style={{marginLeft: -12}} size={48} icon={CommunicationVpnKey} />
          <TextField 
            style={{flexGrow: 1}}
            fullWidth={true} 
            hintText="输入密码" 
            type="password"
            errorText={this.state.passwordErrorText}
            onChange={e => this.updatePassword(e.target.value)} 
          />
        </div>

        <div style={{height: 56, display: 'flex'}}>
          <IconBox style={{marginLeft: -12}} size={48} icon={null} />
          <TextField 
            fullWidth={true} 
            hintText="再次输入密码" 
            type="password"
            errorText={this.state.passwordAgainErrorText}
            onChange={e => this.updatePasswordAgain(e.target.value)} 
          />
        </div>

        <div style={{height: 24}} />
        <div style={{height: 52, display: 'flex', alignItems: 'center', justifyContent: 'flex-end'}}>
          <FlatButton label="取消" primary={this.props.primary} secondary={this.props.accent}
            onTouchTap={this.props.onRequestClose} />
          <FlatButton label="确认" primary={this.props.primary} secondary={this.props.accent}
            disabled={!this.inputOK()}
            onTouchTap={this.fire} />
        </div>
      </div>
    )
  }
}

export default NewUserDialog
