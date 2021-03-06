import React, { Component, PropTypes } from 'react'
import Debug from 'debug'
import { findDOMNode } from 'react-dom'
import { SvgIcon } from 'material-ui'

const debug = Debug('component:photo:SliderToAnimeta:')

export default class SlideToAnimate extends Component {
  constructor(props) {
    super(props)

    this.style = {
      root: {
        position: 'relative',
        height: '100%'
      },
      slidection: {
        position: 'relative',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '75%',
        overflow: 'hidden'
      },
      translate: {
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        transition: 'transform .2s cubic-bezier(0, 1, .5, 1)'
      },
      dire: {
        borderRadius: '15%',
        backgroundColor: 'rgba(50, 50, 50, .5)',
        height: 60,
        position: 'absolute',
        width: 44,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1,
        transition: 'background-color .4s ease'
      },
      leftDire: {
        left: '2%'
      },
      rightDire: {
        right: '2%'
      },
      closeBtn: {
        position: 'absolute',
        top: 12,
        width: 30,
        height: 30,
        right: 'calc(2% + 6px)',
        cursor: 'pointer',
        borderRadius: '15%',
        backgroundColor: 'rgba(50, 50, 50, .5)',
        transition: 'background-color .4s ease',
        zIndex: 1
      }
    }

    this.leftDireStyle = Object.assign({}, this.style.dire, this.style.leftDire)
    this.rightDireStyle = Object.assign({}, this.style.dire, this.style.rightDire)
    this.state = {
      currentIndex: this.props.activeIndex,
      movement: 0
    }

    this.translateLeft = () => {
      const nextIndex = this.state.currentIndex - 1

      if (this.props.translateLeftCallback(nextIndex) === false) { return }

      this.setState({ currentIndex: nextIndex })
      this.setState({ movement: this.state.movement + 1 })
    }

    this.translateRight = () => {
      const prevIndex = this.state.currentIndex + 1

      if (this.props.translateRightCallback(prevIndex) === false) { return }

      this.setState({ currentIndex: prevIndex })
      this.setState({ movement: this.state.movement - 1 })
    }

    this.addHoverBgColor = ref => () => findDOMNode(this.refs[ref]).style.backgroundColor = 'rgba(50, 50, 50, .9)'
    this.resetHoverBgColor = ref => () => findDOMNode(this.refs[ref]).style.backgroundColor = 'rgba(50, 50, 50, .5)'

    this.transformTranslateStyle = () => {
      const { translateDistance, translateGrep } = this.props
      if (translateDistance === 0) return
      const currentIndexDistance = this.state.movement * translateDistance
      // debug('translateDistance, translateGrep', translateDistance, translateGrep)
      return {
        transform: `translate3d(${currentIndexDistance}px, 0, 0)`
      }
    }
    this.onClose = () => {
      this.setState({ movement: 0 })
      this.props.onClose()
    }

    this.reset = ({ translateCount }) => {
      this.translateCount = translateCount
    }

    this.reset(props)
  }

  componentWillReceiveProps(nextProps) {
    this.reset(nextProps)
  }

  render() {
    const { style, children } = this.props
    const slideStyle = Object.assign({}, this.style.translate, this.transformTranslateStyle())

    return (
      <div style={style}>
        <div style={this.style.root}>
          { this.props.onClose ?
            <button
              className="lightbox-close"
              ref="close"
              style={this.style.closeBtn}
              onMouseOver={this.addHoverBgColor('close')}
              onMouseOut={this.resetHoverBgColor('close')}
              onClick={() => this.onClose()}
            >
              <SvgIcon fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                <path d="M0 0h24v24H0z" fill="none" />
              </SvgIcon>
            </button> :
            <div /> }

          { this.translateCount > 1
            && (<a
              href="javascript:;"
              className="lightbox-arrow"
              ref="prev"
              style={this.leftDireStyle}
              onMouseOver={this.addHoverBgColor('prev')}
              onMouseOut={this.resetHoverBgColor('prev')}
              onClick={this.translateLeft}
            >
              <SvgIcon fill="#000000" height="36" viewBox="0 0 24 24" width="36">
                <path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z" />
                <path d="M0-.5h24v24H0z" fill="none" />
              </SvgIcon>
            </a>) }

          { this.translateCount > 1
              && (<a
                href="javascript:;"
                className="lightbox-arrow"
                ref="next"
                style={this.rightDireStyle}
                onMouseOver={this.addHoverBgColor('next')}
                onMouseOut={this.resetHoverBgColor('next')}
                onClick={this.translateRight}
              >
                <SvgIcon fill="#000000" height="36" viewBox="0 0 24 24" width="36" >
                  <path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z" />
                  <path d="M0-.25h24v24H0z" fill="none" />
                </SvgIcon>
              </a>) }

          <div style={this.style.slidection}>
            <div style={slideStyle}>
              { children }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

SlideToAnimate.propTypes = {
  style: PropTypes.object.isRequired,
  translateDistance: PropTypes.number.isRequired,
  translateGrep: PropTypes.number,
  translateCount: PropTypes.number.isRequired,
  children: PropTypes.element.isRequired,
  translateLeftCallback: PropTypes.func,
  translateRightCallback: PropTypes.func,
  activeIndex: PropTypes.number
}

SlideToAnimate.defaultProps = {
  activeIndex: 0,
  translateGrep: 0,
  translateLeftCallback: () => {},
  translateRightCallback: () => {}
}
