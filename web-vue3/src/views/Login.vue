<template>
  <div class="login-container">
    <div class="login-main">
      <div class="header">
        <span class="title">GoEasy示例</span>
        <span class="title">聊天室（直播间）</span>
      </div>
      <div class="content">
        <input :class='nickname === "" ? "nick-input input-notice" : "nick-input"'
               :value="nickname"
               placeholder="请输入昵称"
               @input="onInputUserName">
        <div class="avatar-container">
          <div class="avatar-notice">
            <span>请选择头像</span>
            <span class="avatar-notice-info" v-if="selectedAvatar.imgUrl ===''">请选一个头像哦!!!</span>
          </div>
          <div class="avatar-box">
            <div
              :class="selectedAvatar.id === avatar.id ? 'avatar-box-item active' : 'avatar-box-item'"
              v-for="(avatar, key) in avatarList"
              :key="key"
              @click="onSelectAvatar(avatar)">
              <img :src="avatar.imgUrl"/>
            </div>
          </div>
        </div>
        <div class="room-container">
          <span class="room-title">请选择聊天室</span>
          <div class="room-box">
                <span
                  class="room-box-item"
                  v-for="room in roomList"
                  :key="room.roomId"
                  @click="onSelectRoom(room)">{{ room.name }}
                </span>
          </div>
        </div>
      </div>
      <div class="error-info" v-show="errorInfo">
        <span class="error-info-title">请输入昵称，并选择头像</span>
      </div>
    </div>
  </div>
</template>

<script setup>
  import {ref} from 'vue';
  import {useRouter} from 'vue-router';

  const avatarList = [
    {id: '1', imgUrl: '/static/images/1.png'},
    {id: '2', imgUrl: '/static/images/2.png'},
    {id: '3', imgUrl: '/static/images/3.png'},
    {id: '4', imgUrl: '/static/images/4.png'},
    {id: '5', imgUrl: '/static/images/5.png'},
    {id: '6', imgUrl: '/static/images/6.png'},
    {id: '7', imgUrl: '/static/images/7.png'},
    {id: '8', imgUrl: '/static/images/8.png'}
  ]
  const roomList = [
    {roomId: "001", name: "程序员集散地"},
    {roomId: "002", name: "舌尖上的中国"},
    {roomId: "003", name: "驴友之家"},
    {roomId: "004", name: "球迷乐翻天"}
  ]
  let nickname = ref('')
  let selectedAvatar = ref({
    imgUrl: '',
    id: ''
  })

  let selectedRoom = ref({
    roomId: null,
    roomName: '',
  })
  let errorInfo = ref(false)

  function onInputUserName(event) {// 输入用户名
    nickname.value = event.target.value;
  }

  function onSelectAvatar(avtar) {//选择头像
    selectedAvatar.value = avtar;
  }

  const router = useRouter();

  function onSelectRoom(room) {//登录
    if (selectedAvatar.value.imgUrl !== "" && nickname.value !== "") {
      let roomToken = {
        roomId: room.roomId,
        roomName: room.name,
        userId: (Math.random() * 1000).toString(),
        nickname: nickname.value,
        avatar: selectedAvatar.value.imgUrl
      };
      router.replace({
        path: './chatRoom',
        query: roomToken
      });
    } else {
      errorInfo.value = true;
      setTimeout(() => {
        errorInfo.value = false;
      }, 2000);
    }
  }
</script>

<style scoped>
  .login-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-main {
    width: 850px;
    height: 650px;
  }

  .header {
    padding: 60px 0 25px 0;
    font-size: 14px;
    line-height: 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    font-family: Microsoft YaHei UI;
  }

  .title {
    color: #D02129;
    font-weight: bold;
    font-size: 26px;
    line-height: 33px;
  }

  .content {
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding: 0 30px;
  }

  .avatar-container {
    padding: 30px 0;
  }

  .avatar-notice {
    line-height: 28px;
    font-size: 14px;
  }

  .avatar-notice-info {
    padding-left: 10px;
    color: #D02129;
  }

  .avatar-box {
    height: 105px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
  }

  .avatar-box-item {
    height: 70px;
    width: 70px;
    box-sizing: border-box;
    margin: 4px;
  }

  .avatar-box-item img {
    height: 62px;
    width: 62px;
    background-color: #F0AD4E;
    border-radius: 35px;
  }

  .avatar-box .active {
    border: 4px solid red;
    box-sizing: border-box;
    border-radius: 64.5px;
  }

  .avatar-box .active image {
    border: 4px solid #fff;
    box-sizing: border-box;
  }

  .room-container {
    height: 185px;
  }

  .room-title {
    font-size: 15px;
    line-height: 19px;
  }

  .room-box {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .room-box-item {
    width: 144px;
    height: 45px;
    line-height: 45px;
    text-align: center;
    box-sizing: border-box;
    background-color: #D02129;
    border-radius: 50px;
    color: #fff;
    margin-top: 16px;
    font-size: 13px;
  }

  .input-notice {
    border: 1px solid #D02129 !important;
  }

  .nick-input {
    height: 28px;
    outline: none;
    border-radius: 80px;
    padding: 6px 12px;
    box-sizing: border-box;
    font-size: 9px;
    text-align: center;
    border: 1px solid rgba(0,0,0,0.1);
  }

</style>
