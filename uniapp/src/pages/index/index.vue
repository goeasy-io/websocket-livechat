<template>
  <view>
    <view class="header">
      <text class="title">GoEasy示例</text>
      <text class="title">聊天室（直播间）</text>
    </view>
    <view class="content">
      <input :class='nickname == "" ? "input-notice uni-input" : "uni-input"'
             :value="nickname"
             placeholder="请输入昵称"
             @input="onInputUserName">
      <view class="avatar-container">
        <view class="avatar-notice">
          <text>请选择头像</text>
          <text class="avatar-notice-info" v-if="selectedAvatar.imgUrl ==''">请选一个头像哦!!!</text>
        </view>
        <view class="avatar-box">
          <view
            :class="selectedAvatar.id == avatar.id ? 'avatar-box-item active' : 'avatar-box-item '"
            v-for="(avatar, key) in avatarList"
            :key="key"
            @click="onSelectAvatar(avatar)">
            <image :src="avatar.imgUrl"></image>
          </view>
        </view>
      </view>
      <view class="room-container">
        <text class="room-title">请选择聊天室</text>
        <view class="room-box">
          <text
            class="room-box-item"
            v-for="(room, key) in roomList"
            :key="room.roomId"
            @click="onSelectRoom(room)">{{ room.name }}
          </text>
        </view>
      </view>
      <view class="version">{{ versionName }}</view>
    </view>
  </view>
</template>

<script>
  import * as config from '../../manifest.json';
  export default {
    data() {
      return {
        versionName: config.versionName,
        avatarList: [
          {id: '1', imgUrl: '/static/images/1.png'},
          {id: '2', imgUrl: '/static/images/2.png'},
          {id: '3', imgUrl: '/static/images/3.png'},
          {id: '4', imgUrl: '/static/images/4.png'},
          {id: '5', imgUrl: '/static/images/5.png'},
          {id: '6', imgUrl: '/static/images/6.png'},
          {id: '7', imgUrl: '/static/images/7.png'},
          {id: '8', imgUrl: '/static/images/8.png'}
        ],
        roomList: [
          {roomId: "001", name: "程序员集散地"},
          {roomId: "002", name: "舌尖上的中国"},
          {roomId: "003", name: "驴友之家"},
          {roomId: "004", name: "球迷乐翻天"}
        ],
        nickname: '',
        selectedAvatar: {
          imgUrl: '',
          id: ''
        },
        selectedRoom: {
          roomId: null,
          roomName: '',
        }

      }
    },
    onShow() {
      Object.assign(this.$data, this.$options.data());
    },
    methods: {
      onInputUserName(event) {// 输入用户名
        this.nickname = event.target.value;
      },
      onSelectAvatar(avtar) {//选择头像
        this.selectedAvatar = avtar;
      },
      onSelectRoom(room) {//登录
        if (this.selectedAvatar.imgUrl == "" || this.nickname == "") {
          uni.showToast({
            title: "请输入昵称，并选择头像",
            duration: 2000,
            icon: "none"
          });
          return
        }
        this.roomToken = {
          roomId: room.roomId,
          roomName: room.name,
          userId: (Math.random() * 1000).toString(),
          nickname: this.nickname,
          avatar: this.selectedAvatar.imgUrl
        };
        let roomTokenAsJsonString = JSON.stringify(this.roomToken)
        uni.navigateTo({
          url: "/pages/chatroom/chatroom?roomToken=" + roomTokenAsJsonString
        })
      }
    }
  }
</script>

<style>
  .header {
    padding: 70rpx 0;
    font-size: 28rpx;
    line-height: 48rpx;
    text-align: center;
    display: flex;
    flex-direction: column;
    font-family: Microsoft YaHei UI;
  }

  .title {
    color: #D02129;
    font-weight: bold;
    font-size: 52rpx;
    line-height: 66rpx;
  }

  .content {
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding: 0 60rpx;
  }

  .uni-input {
    height: 72rpx;
    border: 2rpx solid rgba(0, 0, 0, 0.1);
    outline: none;
    border-radius: 200rpx;
    padding: 16rpx 30rpx;
    box-sizing: border-box;
    font-size: 24rpx;
    text-align: center;
  }

  .avatar-container {
    padding: 60rpx 0;
  }

  .avatar-notice {
    line-height: 56rpx;
    font-size: 28rpx;
  }

  .avatar-notice-info {
    padding-left: 20rpx;
    color: #D02129;
  }

  .avatar-box {
    height: 300rpx;
    display: flex;
    flex-wrap: wrap;

  }

  .avatar-box-item {
    height: 140rpx;
    width: 140rpx;
    box-sizing: border-box;
    margin: 8rpx;
  }

  .avatar-box-item image {
    height: 124rpx;
    width: 124rpx;
    background-color: #F0AD4E;
    border-radius: 35px;
  }

  .avatar-box .active {
    border: 8rpx solid red;
    box-sizing: border-box;
    border-radius: 129rpx;
  }

  .avatar-box .active image {
    border: 8rpx solid #fff;
    box-sizing: border-box;
  }

  .room-container {
    height: 370rpx;
  }

  .room-title {
    font-size: 30rpx;
    line-height: 38rpx;
  }

  .room-box {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .room-box-item {
    width: 288rpx;
    height: 90rpx;
    line-height: 90rpx;
    text-align: center;
    box-sizing: border-box;
    background-color: #D02129;
    border-radius: 100rpx;
    color: #fff;
    margin-top: 32rpx;
    font-size: 26rpx;
  }

  .input-notice {
    border: 1px solid #D02129;
  }

  ::-webkit-input-placeholder {
    color: #D02129;
  }

  .version {
    text-align: center;
    color: #ffffff;
    font-size: 40rpx;
  }

</style>
