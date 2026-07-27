const express = require("express");
const resultController = require("../controllers/result.controller");

const router = express.Router();

router.post("/calculate", resultController.calculate);
router.patch("/:id/review", resultController.review);
router.patch("/:id/publish", resultController.publish);
router.get("/", resultController.getAll);
router.get("/:id", resultController.getById);
router.post("/", resultController.create);
router.put("/:id", resultController.update);
router.delete("/:id", resultController.remove);

module.exports = router;
