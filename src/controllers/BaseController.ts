import {Response } from 'express';

class BaseController {
    constructor() {
        console.log("Base Controller");
    }

    protected sendResponse(res: Response, data: any, message: string = 'Success') {
        res.status(200).json({
          message,
          data,
        });
    }
    
      // Menyediakan metode standar untuk mengirim response error
    protected sendError(res: Response, error: string, statusCode: number = 400) {
        res.status(statusCode).json({
            message: error,
        });
    }
    
}

export default BaseController;