import React, { Component } from 'react'
import Loading from '../presentational/Loading'
import VerifiedBankAccountsList from '../presentational/VerifiedBankAccountsList'
import { errorAlert } from '../presentational/alerts'

const ERROR_MSG_CONTRACT_NOT_DEPLOYED = 'Contract is not deployed on this network'
const ERROR_MSG_REMOVE_BANK_ACCOUNT = 'Error removing the verified bank account'
const ERROR_MSG_GET_BANK_ACCOUNTS = 'Error getting verified bank accounts'

class MyBankAccounts extends Component {
  constructor(props) {
    super(props)

    this.state = {
      ethAccount: props.account,
      verifiedBankAccounts: [],
      loading: false
    }

    this.getVerifiedBankAccounts = this.getVerifiedBankAccounts.bind(this)
  }

  async componentDidMount() {
    try {
      this.pobaContract = await this.props.getPoBAContract()
      await this.getVerifiedBankAccounts(this.state.ethAccount)
    } catch (e) {
      console.error(ERROR_MSG_CONTRACT_NOT_DEPLOYED, e)
      errorAlert(ERROR_MSG_CONTRACT_NOT_DEPLOYED)
    }
  }

  async removeBankAccount(bankAccount) {
    this.setState({ loading: true })
    try {
      const walletAddress = this.state.ethAccount
      await this.pobaContract.unregisterBankAccount(bankAccount, walletAddress)
      await this.getVerifiedBankAccounts(walletAddress)
    } catch (e) {
      errorAlert(ERROR_MSG_REMOVE_BANK_ACCOUNT)
      console.error(ERROR_MSG_REMOVE_BANK_ACCOUNT, e)
    } finally {
      this.setState({ loading: false })
    }
  }

  async getVerifiedBankAccounts(ethAccount) {
    this.setState({ loading: true })
    try {
      const verifiedBankAccountsData = await this.pobaContract.getVerifiedBankAccounts(ethAccount)
      const verifiedBankAccounts = verifiedBankAccountsData.map(bankAccountData => ({
        account: bankAccountData[0],
        bankName: bankAccountData[1],
        identityNames: bankAccountData[2].toString(),
        verifiedDate: bankAccountData[3].toString()
      }))
      this.setState({ verifiedBankAccounts })
    } catch (e) {
      errorAlert(ERROR_MSG_GET_BANK_ACCOUNTS)
      console.error(ERROR_MSG_GET_BANK_ACCOUNTS, e)
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const { loading, verifiedBankAccounts } = this.state
    return (
      <div>
        <Loading show={loading} />
        {verifiedBankAccounts.length > 0 ? (
          <VerifiedBankAccountsList
            bankAccounts={verifiedBankAccounts}
            onClick={bankAccount => this.removeBankAccount(bankAccount)}
          />
        ) : (
          <p className="no-results">Could not find bank accounts for the given address.</p>
        )}
      </div>
    )
  }
}

export default MyBankAccounts