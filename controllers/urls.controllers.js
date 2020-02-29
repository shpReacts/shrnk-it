const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

const generateErrMsg = require("../utils/generateErrMsg");

const Url = require("../models/Url.model");
const User = require("../models/User.model");

exports.shrink = async (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return next({ code: 404, message: generateErrMsg(result) });
  }

  let { originalURL, userId } = req.body;

  originalURL = originalURL.toLowerCase();

  if (
    !originalURL.startsWith("https://") &&
    !originalURL.startsWith("http://")
  ) {
    originalURL = "http://" + originalURL;
  }

  let user;
  try {
    user = await User.findById(userId);
  } catch (error) {
    return next({ code: 500 });
  }

  if (!user) {
    return next({ code: 400, message: "Not a valid user id" });
  }

  let isUrlExisting;
  try {
    isUrlExisting = await Url.findOne({ originalURL, creator: user.id });
  } catch (error) {
    return next({ code: 500 });
  }

  if (isUrlExisting) {
    return next({
      code: 400,
      message: "Shrunk url for this long url already existing"
    });
  }

  const newURL = new Url({ originalURL, creator: user.id });

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    await newURL.save({ session });

    user.urls.push(newURL);
    await user.save({ session });

    session.commitTransaction();
  } catch (error) {
    return next({ code: 500 });
  }

  res.status(201).json({ newURL: newURL.toObject({ getters: true }) });
};

exports.delete = async (req, res, next) => {
  const { urlId } = req.params;

  let url;
  try {
    url = await Url.findById(urlId).populate("creator");
  } catch (error) {
    console.log(error);
    return next({ code: 500 });
  }

  if (!url) {
    return next({ code: 404, message: "Shortened Url not found" });
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    await url.remove({ session });
    await url.creator.urls.pull(url);
    await url.creator.save({ session });

    await session.commitTransaction();
  } catch (error) {
    console.log(error);
    return next({ code: 500 });
  }

  res.json({ message: "Successfully deleted shortened url." });
};

// TODO: setUrlName