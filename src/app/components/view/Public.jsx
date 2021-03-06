import React, { Component, PureComponent } from 'react'
import { MenuItem, FloatingActionButton, IconButton } from 'material-ui'
import FileFolderShared from 'material-ui/svg-icons/file/folder-shared'
import FileCreateNewFolder from 'material-ui/svg-icons/file/create-new-folder'
import Radium from 'radium'
import { ipcRenderer } from 'electron'

import DialogOverlay from '../common/DialogOverlay'
import { BreadCrumbItem, BreadCrumbSeparator } from '../common/BreadCrumb'

import ListSelect from '../file/ListSelect'
import FileContent from '../file/FileContent'
import NewFolderDialog from '../file/NewFolderDialog'
import RenameDialog from '../file/RenameDialog'
import MoveDialog from '../file/MoveDialog'
import Base from './Base'
import { command } from '../../lib/command'
import ContextMenu from '../common/ContextMenu'
import FlatButton from '../common/FlatButton'
import FileUploadButton from '../file/FileUploadButton'
import FileDetail from '../file/FileDetail'

class Public extends Base {

  constructor(ctx) {
    super(ctx)
    this.select = new ListSelect(this)
    this.select.on('updated', next => this.setState({ select: next }))
    this.state = {

      select: this.select.state,
      driveListNavDir: null, // save a reference
      adminDrives: null,
      path: [],         //
      entries: [],      // sorted

      contextMenuOpen: false,
      contextMenuY: -1,
      contextMenuX: -1,

      createNewFolder: false,
      rename: false,
      move: false,
      inRoot: false,
      copy: false,
      delete: false,
      detailIndex: -1
    }

    this.updateDetail = (index) => {
      this.setState({ detailIndex: index })
    }

    this.toggleDialog = (type) => {
      this.setState({ [type]: !this.state[type] })
    }

    this.delete = () => {
      const entries = this.state.entries
      const selected = this.state.select.selected
      const count = selected.length
      let finishCount = 0
      const path = this.state.path
      const dirUUID = path[path.length - 1].uuid

      const loop = () => {
        const nodeUUID = entries[selected[finishCount]].uuid
        this.ctx.props.apis.request('deleteDirOrFile', { dirUUID, nodeUUID }, (err, data) => {
          // need to handle this err ? TODO
          if (err) console.log(err)
          finishCount += 1
          if (finishCount === count) {
            if (this.state.path[this.state.path.length - 1].uuid === dirUUID) {
              if (this.state.path.length == 1) { this.ctx.props.apis.request('adminDrives') }
              this.ctx.props.apis.request('driveListNavDir', { rootUUID: this.state.path[1].uuid, dirUUID }, (err, data) => {
                if (!err) {
                  this.ctx.openSnackBar('删除成功')
                } else {
                  this.ctx.openSnackBar(`删除失败: ${err.message}`)
                }
              })
            } else return
          } else loop()
        })
      }
      loop()
      this.toggleDialog('delete')
    }


    ipcRenderer.on('driveListUpdate', (e, obj) => {
      if (this.state.path.length == 0) return
      if (obj.uuid == this.state.path[this.state.path.length - 1].uuid) {
        // this.ctx.openSnackBar(obj.message)
        this.refresh()
      }
    })
  }

  updateState(listNavDir) {
    // console.log(listNavDir)
    if (listNavDir.driveListNavDir === this.state.driveListNavDir &&
     listNavDir.adminDrives === this.state.adminDrives) return

    if (this.state.inRoot) {
      const path = [{ name: '共享文件夹', uuid: null, type: 'publicRoot' }]
      const entries = listNavDir.adminDrives.drives

      entries.forEach(item => item.name = item.label)
      const select = this.select.reset(entries.length)
      const state = { select,
        path,
        entries,
        driveListNavDir: listNavDir.driveListNavDir,
        adminDrives: listNavDir.adminDrives
      }

      this.setState(state)
    } else {
      const path = [{ type: 'public', name: '共享文件夹', uuid: null }].concat(listNavDir.driveListNavDir.path)
      let entries = listNavDir.driveListNavDir.entries
      entries = [...entries].sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1
        if (a.type === 'file' && b.type === 'folder') return 1
        if (a.name) return a.name.localeCompare(b.name)
        return a.label.localeCompare(b.label)
      })

      const select = this.select.reset(entries.length)
      const state = { select,
        path,
        entries,
        driveListNavDir: listNavDir.driveListNavDir,
        adminDrives: listNavDir.adminDrives
      }
      this.setState(state)
    }
  }

  willReceiveProps(nextProps) {
    if (!nextProps.apis || !nextProps.apis.adminDrives) return
    if (nextProps.apis.adminDrives.isPending()) return
    if (nextProps.apis.driveListNavDir && nextProps.apis.driveListNavDir.isPending()) return
    const driveListNavDir = nextProps.apis.driveListNavDir ? nextProps.apis.driveListNavDir.value() : null
    this.updateState({
      driveListNavDir,
      adminDrives: nextProps.apis.adminDrives.value()
    })
  }

  navEnter() {
    this.setState({ inRoot: true })
    this.ctx.props.apis.request('adminDrives')
  }

  navLeave() {
  }

  navGroup() {
    return 'file'
  }

  menuName() {
    return '共享文件夹'
  }

  menuIcon() {
    return FileFolderShared
  }

  appBarStyle() {
    return 'colored'
  }

  prominent() {
    return true
  }

  hasDetail() {
    return true
  }

  detailEnabled() {
    return true
  }

  renderToolBar({ style }) {
    if (this.state.path.length > 1) {
      return (
        <div style={style}>
          <IconButton onTouchTap={this.createNewFolder.bind(this)}>
            <FileCreateNewFolder color="#FFF" />
          </IconButton>
        </div>
      )
    }
    return (<div style={style} />)
  }

  renderTitle({ style }) {
    if (!this.state.listNavDir && !this.state.adminDrives) return

    const path = this.state.path

    const listByBread = (node) => {
      this.ctx.props.apis.request('driveListNavDir', {
        dirUUID: node.uuid,
        rootUUID: this.state.path.length > 1 ? this.state.path[1].uuid : node.uuid
      })
    }

    // each one is preceded with a separator, except for the first one
    // each one is assigned an action, except for the last one
    return (
      <div id="file-breadcrumbs" style={Object.assign({}, style, { marginLeft: '176px' })}>
        { path.reduce((acc, node, index, arr) => {
          if (path.length > 4 && index > 0 && index < path.length - 3) {
            if (index === 1) {
              acc.push(<BreadCrumbSeparator key={node.uuid + index} />)
              acc.push(<BreadCrumbItem text="..." key="..." />)
            }
            return acc
          }

          if (index !== 0) acc.push(<BreadCrumbSeparator key={node.uuid + index} />)

          if (index === 0) { // the first one is always special
            acc.push(<BreadCrumbItem
              text="共享文件夹" key={node.uuid} onTouchTap={() => {
                this.setState({ inRoot: true })
                this.ctx.props.apis.request('adminDrives')
              }}
            />)
          } else if (index === 1) {
            acc.push(
              <BreadCrumbItem
                text={this.state.adminDrives.drives.find(item => item.uuid === node.name).label}
                key={node.uuid} onTouchTap={listByBread.bind(this, node)}
              />)
          } else acc.push(<BreadCrumbItem text={node.name} key={node.uuid} onTouchTap={listByBread.bind(this, node)} />)
          return acc
        }, [])}
      </div>
    )
  }

  listNavBySelect() {
    const selected = this.select.state.selected
    if (selected.length !== 1) return

    const entry = this.state.entries[selected[0]]
    if (entry.type !== 'folder' && entry.type !== 'public') return
    this.setState({ inRoot: false })
    this.ctx.props.apis.request('driveListNavDir', {
      dirUUID: entry.uuid,
      rootUUID: this.state.path.length > 1 ? this.state.path[1].uuid : entry.uuid
    })
  }

  showContextMenu(clientX, clientY) {
    if (this.select.state.ctrl || this.select.state.shift) return
    const containerDom = document.getElementById('content-container')
    const maxLeft = containerDom.offsetLeft + containerDom.clientWidth - 240
    const x = clientX > maxLeft ? maxLeft : clientX
    const maxTop = containerDom.offsetTop + containerDom.offsetHeight - 192
    const y = clientY > maxTop ? maxTop : clientY
    this.setState({
      contextMenuOpen: true,
      contextMenuX: x,
      contextMenuY: y
    })
  }

  hideContextMenu() {
    this.setState({
      contextMenuOpen: false,
      contextMenuX: -1,
      contextMenuY: -1
    })
  }

  openRename() {
    this.setState({ rename: true })
  }

  closeRename() {
    this.setState({ rename: false })
    this.refresh()
  }

  openMove() {
    this.setState({ move: true })
  }

  closeMove() {
    this.setState({ move: false })
  }

  openCopy() {
    this.setState({ copy: true })
  }

  closeCopy() {
    this.setState({ copy: false })
  }

  createNewFolder() {
    this.setState({ createNewFolder: true })
  }

  closeCreateFolder() {
    this.setState({ createNewFolder: false })
    this.refresh()
  }

  refresh() {
    const request = this.ctx.props.apis.request
    const path = this.state.path
    if (this.state.inRoot) request('adminDrives')
    else {
      request('driveListNavDir', {
        dirUUID: path[path.length - 1].uuid,
        rootUUID: path[1].uuid
      })
    }
  }

  download() {
    const entries = this.state.entries
    const selected = this.state.select.selected
    const path = this.state.path
    const folders = []
    const files = []

    selected.forEach((item) => {
      const obj = entries[item]
      if (obj.type == 'public') obj.type = 'folder'
      if (obj.type == 'folder') folders.push(obj)
      else if (obj.type == 'file') files.push(obj)
    })

    const args = { folders, files, dirUUID: path[path.length - 1].uuid }
    // console.log(args)
    command('fileapp', 'DOWNLOAD', args)
  }

  upload(type) {
    const dirPath = this.state.path
    const dirUUID = dirPath[dirPath.length - 1].uuid
    console.log(dirUUID, type)
    command('fileapp', 'UPLOAD', { dirUUID, type })
  }

  createFolder(value) {
    this.setState({ createNewFolder: false })
    const path = this.state.path
    const curr = path[path.length - 1]
    const args = {
      dirUUID: curr.uuid,
      dirname: value
    }
    console.log(args)
    this.ctx.props.apis.request('mkdir', args, (err, data) => {
      if (err) this.setState({ errorText: err.message })
      else this.props.onRequestClose(true)
    })
  }


  /** renderers **/

  renderDetail({ style }) {
    return (
      <div style={style}>
        {
          this.state.entries.length ?
            <FileDetail
              detailFile={this.state.entries[this.state.detailIndex]}
              path={this.state.path}
              ipcRenderer={ipcRenderer}
            /> :
            <div style={{ height: 128, backgroundColor: '#00796B' }} />
        }
      </div>
    )
  }
  renderContent({ openSnackBar }) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {this.state.path.length > 1 && <FileUploadButton upload={this.upload.bind(this)} />}
        <FileContent
          home={this.state}
          select={this.state.select}
          entries={this.state.entries}
          listNavBySelect={this.listNavBySelect.bind(this)}
          showContextMenu={this.showContextMenu.bind(this)}
          updateDetail={this.updateDetail}
        />

        <ContextMenu
          open={this.state.contextMenuOpen}
          top={this.state.contextMenuY}
          left={this.state.contextMenuX}
          onRequestClose={() => this.hideContextMenu()}
        >
          <MenuItem primaryText="新建文件夹" disabled={!(this.state.path.length > 1)} onTouchTap={this.createNewFolder.bind(this)} />
          <MenuItem primaryText="下载" onTouchTap={this.download.bind(this)} />
          <MenuItem primaryText="刪除" disabled={!(this.state.path.length > 1)} onTouchTap={() => this.toggleDialog('delete')} />
          <MenuItem primaryText="重命名" disabled={!(this.state.path.length > 1)} onTouchTap={this.openRename.bind(this)} />
          <MenuItem primaryText="移动" disabled={!(this.state.path.length > 1)} onTouchTap={this.openMove.bind(this)} />
          <MenuItem primaryText="拷贝" disabled={!(this.state.path.length > 1)} onTouchTap={this.openCopy.bind(this)} />
        </ContextMenu>

        <DialogOverlay open={!!this.state.createNewFolder} onRequestClose={this.closeCreateFolder.bind(this)}>
          { this.state.createNewFolder &&
            <NewFolderDialog
              apis={this.ctx.props.apis}
              path={this.state.path}
              entries={this.state.entries}
              openSnackBar={openSnackBar}
            /> }
        </DialogOverlay>

        <DialogOverlay open={this.state.rename} onRequestClose={this.closeRename.bind(this)}>
          { this.state.rename &&
            <RenameDialog
              apis={this.ctx.props.apis}
              path={this.state.path}
              entries={this.state.entries}
              select={this.state.select}
            /> }
        </DialogOverlay>

        <DialogOverlay open={this.state.move} onRequestClose={this.closeMove.bind(this)}>
          { this.state.move && <MoveDialog
            apis={this.ctx.props.apis}
            path={this.state.path}
            entries={this.state.entries}
            select={this.state.select}
            type="public"
            operation="move"
          />}
        </DialogOverlay>

        <DialogOverlay open={this.state.copy} onRequestClose={this.closeCopy.bind(this)}>
          { this.state.copy && <MoveDialog
            apis={this.ctx.props.apis}
            path={this.state.path}
            entries={this.state.entries}
            select={this.state.select}
            type="public"
            operation="copy"
          />}
        </DialogOverlay>

        <DialogOverlay open={this.state.delete}>
          {
            this.state.delete &&
            <div style={{ width: 280, padding: '24px 24px 0px 24px' }}>
              <div style={{ color: 'rgba(0,0,0,0.54)' }}>{'确定删除？'}</div>
              <div style={{ height: 24 }} />
              <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginRight: -24 }}>
                <FlatButton label="取消" primary onTouchTap={() => this.toggleDialog('delete')} />
                <FlatButton
                  label="确认"
                  primary
                  onTouchTap={this.delete}
                />
              </div>
            </div>

          }
        </DialogOverlay>
      </div>


    )
  }
}

export default Public
