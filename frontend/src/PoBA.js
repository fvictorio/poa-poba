import React, { Component } from 'react'
import PlaidLink from 'react-plaid-link'
import axios from 'axios'
import contract from 'truffle-contract'
import pobaArtifact from './artifacts/PoBA.json' // eslint-disable-line import/no-unresolved
import Title from './ui/Title'
import Loading from './ui/Loading'
import RegisteredAccountsList from './ui/RegisteredAccountsList'
import plaidLinkButtonStyles from './ui/styles/plaidLinkButton'
import { successAlert, errorAlert } from './alerts'

const PobaContract = contract(pobaArtifact)

const getBankAccounts = async token => {
  const result = await axios.get(`/api/accounts/bank-accounts/${token}`)

  return result.data.accounts.numbers
}

const getSignedBankAccount = async (accountId, ethAccount, token) => {
  const result = await axios.post('/api/accounts/sign-account', {
    accountId,
    ethAccount,
    token
  })

  return result.data
}

const getTxData = async (web3, ethAccount, token) => {
  const accounts = await getBankAccounts(token)
  const { account, v, r, s } = await getSignedBankAccount(accounts[0].account_id, ethAccount, token)

  return Promise.resolve({
    account,
    v,
    r,
    s
  })
}

class PoBA extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      registeredAccounts: []
    }

    this.pobaContract = null
  }

  async componentDidMount() {
    const { web3, account } = this.props

    PobaContract.setProvider(web3.currentProvider)

    this.pobaContract = await PobaContract.deployed()

    const registeredAcountsCount = await this.pobaContract.accountsLength.call(account)

    const whenAccounts = []
    for (let i = 0; i < registeredAcountsCount; i++) {
      whenAccounts.push(this.pobaContract.accounts(account, i))
    }

    const registeredAccounts = await Promise.all(whenAccounts)

    this.setState({ registeredAccounts })
  }

  createProof = async token => {
    const { web3, account } = this.props

    this.setState({ loading: true })
    return getTxData(web3, account, token).then(txData => {
      this.pobaContract
        .register(txData.account, txData.v, txData.r, txData.s, {
          from: account
        })
        .then(
          () => successAlert(),
          e => {
            console.error('There was a problem registering the address', e)
            errorAlert()
          }
        )
        .finally(() => this.setState({ loading: false }))
    })
  }

  render() {
    return (
      <div>
        <Title />

        <p>
          Turpis, fermentum a, aliquet quis, sodales at, dolor. Duis eget velit eget risus fringilla
          hendrerit. Nulla facilisi. Mauris turpis pede, aliquet ac, mattis sed, consequat in,
          massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus
          mus. Etiam egestas posuere metus. Aliquam erat volutpat. Donec non tortor. Vivamus posuere
          nisi mollis dolor. Quisque porttitor nisi ac elit. Nullam tincidunt ligula vitae nulla.
        </p>

        <PlaidLink
          clientName="Your app name"
          env={process.env.REACT_APP_PLAID_ENV}
          institution={null}
          publicKey={process.env.REACT_APP_PLAID_PUBLIC_KEY}
          product={['auth']}
          onSuccess={this.createProof}
          className={plaidLinkButtonStyles}
          style={{}}
        >
          Register bank account
        </PlaidLink>

        <RegisteredAccountsList accounts={this.state.registeredAccounts} />

        <Loading show={this.state.loading} />
      </div>
    )
  }
}

export default PoBA
