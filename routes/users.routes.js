const router = require("express").Router();
const { check } = require("express-validator");

const usersController = require("../controllers/users.controllers");

const signupValidators = [
  check("email")
    .normalizeEmail()
    .isEmail()
    .withMessage("Invalid email"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Must be at least 6 characters long")
    .not()
    .matches(/\s/)
    .withMessage("Must not contain white space")
    .escape(),
  check("name")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Must not be empty")
    .escape()
];

router.post("/signup", signupValidators, usersController.signup);
router.post("/login", usersController.login);
router.get("/:userId/urls", usersController.getUrlsByUserId);

module.exports = router;
