import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom'
import api from 'boost/api'
import clientKey from 'boost/clientKey'
const clipboard = require('electron').clipboard

function getDefault () {
  return {
    openDropdown: false,
    isSharing: false,
    // Fetched url
    url: null,
    // for tooltip Copy -> Copied!
    copied: false
  }
}

export default class ShareButton extends React.Component {
  constructor (props) {
    super(props)
    this.state = getDefault()
  }

  componentWillReceiveProps (nextProps) {
    this.setState(getDefault())
  }

  componentDidMount () {
    this.dropdownInterceptor = e => {
      this.dropdownClicked = true
    }
    ReactDOM.findDOMNode(this.refs.dropdown).addEventListener('click', this.dropdownInterceptor)
    this.shareWithPublicURLHandler = e => {
      this.handleShareWithPublicURLClick(e)
    }
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.dropdownHandler)
    ReactDOM.findDOMNode(this.refs.dropdown).removeEventListener('click', this.dropdownInterceptor)
  }

  handleOpenButtonClick (e) {
    this.openDropdown()
    if (this.dropdownHandler == null) {
      this.dropdownHandler = e => {
        if (!this.dropdownClicked) {
          this.closeDropdown()
        } else {
          this.dropdownClicked = false
        }
      }
    }
    document.removeEventListener('click', this.dropdownHandler)
    document.addEventListener('click', this.dropdownHandler)
  }

  openDropdown () {
    this.setState({openDropdown: true})
  }

  closeDropdown () {
    document.removeEventListener('click', this.dropdownHandler)
    this.setState({openDropdown: false})
  }

  handleShareWithPublicURLClick (e) {
    let input = Object.assign({}, this.props.article, {clientKey: clientKey.get()})
    api.shareWithPublicURL(input)
      .then(res => {
        let url = res.body.url
        this.setState({url: url})
      })
      .catch(err => {
        console.log(err)
      })
  }

  handleCopyURLClick () {
    clipboard.writeText(this.state.url)
    this.setState({copied: true})
  }

  // Restore copy url tooltip
  handleCopyURLMouseLeave () {
    this.setState({copied: false})
  }

  render () {
    let hasPublicURL = this.state.url != null
    return (
      <div className='ShareButton'>
        <button ref='openButton' onClick={e => this.handleOpenButtonClick(e)} className='ShareButton-open-button'>
          <i className='fa fa-fw fa-share-alt'/>
          {
            this.state.openDropdown ? null : (
              <span className='tooltip'>Share</span>
            )
          }
        </button>
        <div ref='dropdown' className={'share-dropdown' + (this.state.openDropdown ? '' : ' hide')}>
          {
            !hasPublicURL ? (
              <button
                onClick={e => this.shareWithPublicURLHandler(e)}
                ref='sharePublicURL'
                disabled={this.state.isSharing}>
                <i className='fa fa-fw fa-external-link'/> {!this.state.isSharing ? 'Share with public URL' : 'Sharing...'}
              </button>
            ) : (
              <div className='ShareButton-url'>
                <input className='ShareButton-url-input' value={this.state.url} readOnly/>
                <button
                  onClick={e => this.handleCopyURLClick(e)}
                  className='ShareButton-url-button'
                  onMouseLeave={e => this.handleCopyURLMouseLeave(e)}
                  >
                  <i className='fa fa-fw fa-clipboard'/>
                  <div className='ShareButton-url-button-tooltip'>{this.state.copied ? 'Copied!' : 'Copy URL'}</div>
                </button>
                <div className='ShareButton-url-alert'>This url is valid for 7 days.</div>
              </div>
            )
          }
        </div>
      </div>
    )
  }
}

ShareButton.propTypes = {
  article: PropTypes.shape({
    publicURL: PropTypes.string
  })
}
