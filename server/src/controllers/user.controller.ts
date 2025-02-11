const User = require("../models/user.model");
const bcrypt = require("bcrypt");
require("dotenv").config();

import { Request, Response } from "express";

declare module "express-session" {
  export interface SessionData {
    uid: string; // Define the custom property `uid`
  }
}
interface SessionData extends Request {
  uid: string;
}

interface UserController {
  checkUser(req: SessionData, res: Response): Promise<void>;
  createUser(req: SessionData, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
  deleteUser(req: SessionData, res: Response): Promise<void>;
}

const checkUser = async (req: SessionData, res: Response): Promise<void> => {
  try {
    //checks that the required user does exist
    let user = await User.findOne({ email: req.body.email });
    if (user == null) {
      res.status(418).send({ status: "user does not exist" });
    } else {
      let passwordCheck = await bcrypt.compare(
        req.body.password,
        user.password,
      );

      if (passwordCheck == true) {
        //sets the session id to the username
        if (process.env.ENV != 'test') req.session.uid = user._id;
        res.status(200).send({ username: user.username });
      } else {
        res.status(418).send({ status: "incorrect details" });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const createUser = async (req: SessionData, res: Response): Promise<void> => {
  try {
    //checks that another user with the same info does not already exist
    let userEmail = await User.findOne({ email: req.body.email });
    let userName = await User.findOne({ username: req.body.username });
    if (userEmail == null && userName == null) {
      //if all good hashes the password and sends it ot the database
      const passwordHash = await bcrypt.hash(req.body.password, 10);
      let newUser = new User({
        ...req.body,
        password: passwordHash,
      });

      //sets the session id and saves to the database
      if (process.env.ENV != 'test') req.session.uid = newUser._id;
      await newUser.save();

      res.status(200).send({ status: "complete" });

      //next two if else statements tell the user what needs changing
    } else if (userEmail != null) {
      res.status(400).send({ status: "email already exists" });
    } else if (userName != null) {
      res.status(400).send({ status: "username already exists" });
    }
  } catch (error) {
    console.log(error);
  }
};

const logout = async (req: Request, res: Response): Promise<void> => {
  req.session.destroy((error) => {
    if (error) {
      res.status(400).send({ status: "could not log out" });
    } else {
      res.clearCookie("sid").status(200).send({ status: "logged out" });
    }
  });
};

const deleteUser = async (req: SessionData, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ username: req.body.user });
    if (user === null) {
      res.status(418).send({ status: "could not delete account" });
    } else {
      let passwordCheck = await bcrypt.compare(
        req.body.password,
        user.password,
      );
      if (passwordCheck == true) {
        if (process.env.ENV == 'test') {
          await User.deleteOne({ username: req.body.user });
          res.status(200).send({ status: "deleted account" });
        }
        req.session.destroy(async (error) => {
          if (error) {
            res.status(400).send({ status: "could not delete account" });
          } else {
            await User.deleteOne({ username: req.body.user });
            res
              .clearCookie("sid")
              .status(200)
              .send({ status: "deleted account" });
          }
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const userController: UserController = {
  checkUser,
  createUser,
  logout,
  deleteUser,
};

module.exports = userController;
