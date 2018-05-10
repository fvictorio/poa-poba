const { Router } = require('express')

const router = new Router()
const Web3 = require('web3')
const plaidClient = require('../etc/plaid')
const logger = require('../etc/logger')

const { PRIVATE_KEY } = process.env
const web3 = new Web3()

const exchangePublicToken = async token => {
  const tokenResponse = await plaidClient.exchangePublicToken(token)
  if (tokenResponse.status_code !== 200) {
    logger.error({ status: tokenResponse.status_code }, 'Error exchanging public token')
    throw Error(`[exchangePublicToken] ${tokenResponse.error_code}: {tokenResponse.error_message}`)
  }
  return tokenResponse
}

const getBankAccountData = async accessToken => {
  const response = await plaidClient.getAuth(accessToken)
  if (response.status_code !== 200) {
    logger.error({ status: response.status_code }, 'Error getting bank account')
    throw Error(`[getBankAccountData] ${response.error_code}: {response.error_message}`)
  }
  return response
}

router.post('/', (req, res) => {
  const { ethAccount, token } = req.body

  logger.info({ ethAccount }, 'Getting bank accounts')

  return exchangePublicToken(token)
    .then(tokenResponse => {
      const accessToken = tokenResponse.access_token
      return getBankAccountData(accessToken)
    })
    .then(accountData => {
      logger.info({ accountData }, 'Got account data')
      const { numbers } = accountData
      const bankAccount = numbers.ach[0].account

      logger.info({ bankAccount }, 'Got bank account')
      const hash = web3.utils.sha3(ethAccount + Buffer.from(bankAccount).toString('hex'))
      const { v, r, s } = web3.eth.accounts.sign(hash, PRIVATE_KEY)

      res.send({ bankAccount, v, r, s })
    })
    .catch(e => {
      logger.error(e, 'There was an error getting the transaction data')
      res.send({ error: e })
    })
})

module.exports = router
