const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { accountSchema, historySchema, configSchema } = require('../../../schemas')
const { bcrypt, jsonWebToken } = require('../../util')
const secretKey = process.env.JWT_SECRET;
class adminControllers {
    
    async getHistoryCall(req, res) {
        try {
            const data = await historySchema.find().sort({ createdAt: -1 });
            res.status(200).json({code: 1, total: data.length, items: data});
        } catch (error) {
            console.error('Error fetching history:', error);
            res.status(500).json({ code: 0, message: 'Internal Server Error' });
        }
    }

    async deleteAllHistoryCall(req, res) {
      try {
          const data = await historySchema.find();
          res.status(200).json({code: 1, total: data.length, items: data});
      } catch (error) {
          console.error('Error fetching history:', error);
          res.status(500).json({ code: 0, message: 'Internal Server Error' });
      }
  }

    async login(req, res){
        try {
          const {user, pass} = req.body
          const accountDb = await accountSchema.findOne({user})
          if(!accountDb) return res.status(200).json({code: 0, message : 'Tài khoản không tồn tại'})
          const isCheck = await bcrypt.bcryptCompare(accountDb.pass, pass)
          if(!isCheck) return res.status(200).json({code: 0,  message: 'Sai tài khoản hoặc mật khẩu' })
          const jwtCode = await jsonWebToken.generateJWT({user})
          return res.status(201).json({code: 1, jwt: jwtCode})
        } catch (error) {
          console.error(error)
          res.json({message: error.message})
        }
    }

    // async updatePassword(req, res, next){
    //     const { user } = req;
    // }

    async verifyJWT(req, res, next) {
      try {
        const { token } = req.body;
        const decodedPayload = await jwt.verify(token, secretKey);
        if (!decodedPayload) return res.status(200).json({ code: 0, message: 'Phiên đăng nhập hết hạn' });
        return res.status(200).json({ code: 1, message: 'Còn hạn sử dụng' });
      } catch (error) {
        console.error('JWT:', error.message);
        return res.status(200).json({ code: 0, message: 'Phiên đăng nhập hết hạn' });
      }
  }

    async mdwVerifyJWT(req, res, next) {
        try {
          const { token } = req.body;
          if (!token) return res.status(401).json({ code: 0, message: 'Token không tồn tại' });
          const decodedPayload = await jwt.verify(token, secretKey);
          if (!decodedPayload) return res.status(401).json({ code: 0, message: 'Phiên đăng nhập hết hạn' });
          req.user = decodedPayload;
          next();
        } catch (error) {
          console.error('Lỗi xác thực JWT:', error.message);
          return res.status(500).json({ code: 0, message: 'Lỗi xác thực JWT' });
        }
    }
     
    async editConfig(req, res) {
      try {
        let { timeAwaitUser, titleUser, titleHome, msgStart, msgBusy, msgDone, msgConnect } = req.body;
        timeAwaitUser = Number(timeAwaitUser)
        if (!timeAwaitUser || typeof timeAwaitUser !== 'number' || timeAwaitUser <= 20 || timeAwaitUser >= (60*5)) {
          return res.status(400).json({ code: 0, message: 'Thời gian chờ người dùng không hợp lệ' });
        }
    
        const dataUpdate = {
          timeAwaitUser: timeAwaitUser || 60,
          titleHome,
          titleUser,
          msgStart,
          msgBusy,
          msgDone,
          msgConnect,
        };
    
        await configSchema.updateOne({ _id: '655b8b37f1a2029969205f9f' }, dataUpdate);
        return res.status(201).json({ code: 1, message: 'Thay đổi thành công' });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ code: 0, message: 'Thay đổi thất bại' });
      }
    }

    async getConfig(req, res) {
      try {
        const data = await configSchema.findOne({ _id: '655b8b37f1a2029969205f9f' });
    
        if (!data) {
          return res.status(404).json({ code: 0, message: 'Không tìm thấy cấu hình' });
        }
    
        return res.status(200).json({ code: 1, message: 'Thành công', data });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ code: 0, message: 'Thay đổi thất bại' });
      }
    }
    
    

}

module.exports = new adminControllers