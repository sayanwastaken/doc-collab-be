import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseFilters,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserType, SigninResponse } from './types/user.types';
import {
  CreateUserDto,
  GetAllUsersDto,
  SigninDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './dto/user.dto';
import { UserExceptionFilter } from './exceptions/user.exception';
import {
  ForgotPasswordResponse,
  VerifyOtpResponse,
  ResetPasswordResponse,
} from './types/user.types';

@Controller('users')
@UseFilters(UserExceptionFilter)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(@Query() query: GetAllUsersDto): Promise<UserType[]> {
    try {
      const users = await this.userService.getUsers(query.page, query.limit);
      return users;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/signup')
  async createUser(@Body() user: CreateUserDto): Promise<UserType> {
    try {
      const newUser = await this.userService.createUser(user);
      return newUser;
    } catch (error) {
      throw error;
    }
  }

  @Post('/signin')
  async signin(@Body() user: SigninDto): Promise<SigninResponse> {
    try {
      const newUser = await this.userService.signin(user);
      return newUser;
    } catch (error) {
      throw error;
    }
  }

  @Post('/forgot-password')
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponse> {
    return this.userService.forgotPassword(dto);
  }

  @Post('/verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<VerifyOtpResponse> {
    return this.userService.verifyOtp(dto);
  }

  @Post('/reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<ResetPasswordResponse> {
    return this.userService.resetPassword(dto);
  }
}
