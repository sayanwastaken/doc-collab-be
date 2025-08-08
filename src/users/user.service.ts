import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../models/mongo/user.schema';
import { UserType } from './types/user.types';
import { hashPassword, comparePassword } from '../utils/passwordutils';
import {
  SigninDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './dto/user.dto';
import {
  SigninResponse,
  ForgotPasswordResponse,
  VerifyOtpResponse,
  ResetPasswordResponse,
} from './types/user.types';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '../utils/mailer.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}
  private readonly SALT_ROUNDS = 10;
  private readonly OTP_EXPIRY_MINUTES = 10;

  async getUsers(page: number, limit: number): Promise<UserType[]> {
    try {
      const users = await this.userModel
        .find({})
        .skip((page - 1) * limit)
        .limit(limit);
      return users.map((user: UserDocument) => ({
        _id: (user as any)._id.toString(),
        name: user.name,
        email: user.email,
      }));
    } catch (error) {
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findOne({ email }).exec();
    } catch (error) {
      throw new HttpException(
        'Failed to check user existence',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createUser(user: {
    name: string;
    email: string;
    password: string;
  }): Promise<UserType> {
    try {
      // Check if user already exists
      const existingUser = await this.findUserByEmail(user.email);
      if (existingUser) {
        throw new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        );
      }

      const hashedPassword = await hashPassword(
        user.password,
        this.SALT_ROUNDS,
      );

      const newUser = await this.userModel.create({
        ...user,
        password: hashedPassword,
      });

      return {
        _id: (newUser as any)._id.toString(),
        name: newUser.name,
        email: newUser.email,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw error;
    }
  }

  async signin(user: SigninDto): Promise<SigninResponse> {
    try {
      const existingUser = await this.findUserByEmail(user.email);
      if (!existingUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const isPasswordValid = await comparePassword(
        user.password,
        existingUser.password,
      );
      if (!isPasswordValid) {
        throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
      }

      const payload = {
        userId: (existingUser as any)._id.toString(),
        username: existingUser.name,
        email: existingUser.email,
      };

      // Check if JWT secret is configured
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new HttpException(
          'JWT secret not configured',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: '15m',
      });
      const refreshToken = await this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      });

      return {
        user: {
          _id: (existingUser as any)._id.toString(),
          name: existingUser.name,
          email: existingUser.email,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Signin error:', error);

      if (error.message?.includes('JWT')) {
        throw new HttpException(
          'JWT configuration error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException(
        'Failed to signin',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponse> {
    const user = await this.findUserByEmail(dto.email);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60000);
    // Store OTP in user document
    user.otp = otp;
    user.otpExpiresAt = expiresAt;
    await user.save();
    // Send OTP email
    await this.mailerService.sendMail({
      to: dto.email,
      subject: 'Your Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It is valid for ${this.OTP_EXPIRY_MINUTES} minutes.`,
    });
    return { message: 'OTP sent to email' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<VerifyOtpResponse> {
    const user = await this.findUserByEmail(dto.email);
    if (!user || !user.otp || !user.otpExpiresAt) {
      throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
    }
    if (user.otp !== dto.otp) {
      throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
    }
    if (user.otpExpiresAt < new Date()) {
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      await user.save();
      throw new HttpException('OTP expired', HttpStatus.BAD_REQUEST);
    }
    return { message: 'OTP verified' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<ResetPasswordResponse> {
    const user = await this.findUserByEmail(dto.email);
    if (!user || !user.otp || !user.otpExpiresAt) {
      throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
    }
    if (user.otp !== dto.otp) {
      throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
    }
    if (user.otpExpiresAt < new Date()) {
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      await user.save();
      throw new HttpException('OTP expired', HttpStatus.BAD_REQUEST);
    }
    user.password = await hashPassword(dto.newPassword, this.SALT_ROUNDS);
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();
    return { message: 'Password reset successful' };
  }
}
