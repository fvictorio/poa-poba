const { Router } = require('express')

const router = new Router()
const Web3 = require('web3')
const txDataController = require('../controllers/txData')

const logger = require('../etc/logger')

const { PRIVATE_KEY } = process.env
const web3 = new Web3()

router.post('/', (req, res) => {
  const { ethAccount, token } = req.body
  logger.info({ ethAccount }, 'Getting bank accounts')
  const getTxData = async () => {
    try {
      const accessToken = await txDataController.getAccessToken(token)
      const bankAccount = await txDataController.getBankAccount(accessToken)
      const hash = web3.utils.sha3(ethAccount + Buffer.from(bankAccount).toString('hex'))
      const { v, r, s } = web3.eth.accounts.sign(hash, PRIVATE_KEY)

      res.send({ bankAccount, v, r, s })
    } catch (e) {
      logger.error(e, 'There was an error getting the transaction data')
      res.send({ error: e })
    }
  }

  return getTxData()
})

module.exports = router
