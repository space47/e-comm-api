const express = require('express')
const router = express.Router()
const {authenticateUser, authorizePermission} = require('../middleware/authentication')
const {
    getAllUsers,
    getSingleUser,
    showCurrentUser,
    updateUser,
    updateUserPassword
} = require('../controller/userController')

router.route('/').get(authenticateUser,authorizePermission('admin','owner'),getAllUsers);

router.route('/showMe').get(authenticateUser,showCurrentUser)
router.route('/updateUser').patch(authenticateUser,updateUser)
router.route('/updateUserPassword').patch(authenticateUser,updateUserPassword)

router.route('/:id').get(authenticateUser,getSingleUser)

module.exports = router
