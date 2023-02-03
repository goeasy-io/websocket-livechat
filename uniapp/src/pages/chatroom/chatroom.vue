<template>
  <view class="chat-room">
    <view class="header">
      <span class="quit-btn" @click="quitRoom">X</span>
      <view>{{ currentRoom.roomName }}</view>
    </view>
    <view class="online-avatar-container">
      <view class="online-avatar-item" v-for="(user, key) in currentRoom.onlineUsers.users" :key="key"
            :style="(currentRoom.onlineUsers.users.length-1)===key?'':'transform:translateX('+((currentRoom.onlineUsers.users.length-1-key)*20+20)+'rpx)'">
        <image :src="user.avatar"></image>
      </view>
      <view class="online-count">{{ currentRoom.onlineUsers.count }}</view>
    </view>
    <view class="chat-room-container">
      <view class="scroll-view">
        <view class="message-box" v-for="(message, key) in currentRoom.messages" :key="key" :id="'message-box'+ key">
          <view class="message-item">
            <text class="user-name">{{ message && message.senderNickname }}:</text>
            <text :class="message.senderUserId === currentRoom.currentUser.id ? 'user-message self' : 'user-message' ">
              {{ message && message.content }}
            </text>
          </view>
        </view>
      </view>
      <view class="chat-room-input">
        <view style="position: relative;">
          <input class="uni-input" :value="newMessageContent" placeholder="说点什么..." @input="onInputMessage" @confirm="sendMessageByEnter"/>
          <view class="uni-btn" @click="sendMessage(MessageType.CHAT, newMessageContent)">↑</view>
        </view>
        <image class="heart" @click="sendMessage(MessageType.PROP, Prop.HEART)"
               src="/static/images/handle-heart.png"></image>
        <image class="rocket" @click="sendMessage(MessageType.PROP, Prop.ROCKET)"
               src="/static/images/rocket.png"></image>
      </view>
    </view>
    <view class="show-animation" v-if="propDisplay.play">
      <view v-if="propDisplay.showPropType === Prop.HEART">
        <image class="prop-heart" v-for="(value, key) in 4" :key="key" src="/static/images/heart.png"></image>
      </view>
      <view v-if="propDisplay.showPropType === Prop.ROCKET">
        <image class="prop-rocket" src="/static/images/rocket.png"></image>
      </view>
    </view>
  </view>
</template>

<script setup>
  import {ref, inject, nextTick} from 'vue';
  import {onShow, onUnload} from "@dcloudio/uni-app";
  import {useRoute, useRouter} from 'vue-router';

  const route = useRoute();
  const router = useRouter();
  const goEasy = inject('goEasy');

  let currentRoom = ref({
    roomId: null,
    roomName: null,
    onlineUsers: {
      count: 0,
      users: []
    },
    messages: [],
    currentUser: {
      id: null,
      nickname: null,
      avatar: null
    }
  })
  let propDisplay = ref({
    showPropType: 0,
    play: false,
    timer: null
  })
  let newMessageContent = ref('')
  // 道具类型
  const Prop = {
    HEART: 0,//桃心
    ROCKET: 1//火箭
  }
  // 消息类型
  const MessageType = {
    CHAT: 0,//文字聊天
    PROP: 1//道具
  }

  onShow(() => {
    console.log('onShow')
    //获取数据
    let roomToken = route.query;
    currentRoom.value.roomId = roomToken.roomId;
    currentRoom.value.roomName = roomToken.roomName;
    currentRoom.value.currentUser = {
      id: roomToken.userId,
      nickname: roomToken.nickname,
      avatar: roomToken.avatar
    };
    // 连接goEasy
    connectGoEasy();

    // 监听用户上下线
    listenUsersOnlineOffline();
    // 监听新消息
    listenNewMessage();
  })


  onUnload(() => {
    quitRoom();
  })

  // 连接goEasy
  const connectGoEasy = () => {
    let userData = {
      avatar: currentRoom.value.currentUser.avatar,
      nickname: currentRoom.value.currentUser.nickname
    }
    goEasy.connect({
      id: currentRoom.value.currentUser.id,
      data: userData,
      onSuccess: function () {
        console.log("GoEasy connect successfully.");
        // 加载在线用户列表
        loadOnlineUsers();
        // 加载最后10条消息历史
        loadHistory();
      },
      onFailed: function (error) {
        console.log("Failed to connect GoEasy, code:" + error.code + ",error:" + error.content);
      },
      onProgress: function (attempts) {
        console.log("GoEasy is connecting", attempts);
      }
    });
  }

  // 监听用户上下线
  const listenUsersOnlineOffline = () => {
    let roomId = currentRoom.value.roomId;
    goEasy.pubsub.subscribePresence({
      channel: roomId,
      onPresence: (presenceEvents) => {
        currentRoom.value.onlineUsers.count = presenceEvents.clientAmount;
        presenceEvents.events.forEach(function (event) {
          let userData = event.data;
          if (event.action === "join" || event.action === "online") {
            //进入房间
            let userId = event.id;
            let avatar = userData.avatar;
            let nickname = userData.nickname;
            let user = {
              id: userId,
              avatar: avatar,
              nickname: nickname
            };
            //添加新用户
            currentRoom.value.onlineUsers.users.push(user);
            //添加进入房间的消息
            let message = {
              content: " 进入房间",
              senderUserId: userId,
              senderNickname: nickname,
              type: MessageType.CHAT
            };
            currentRoom.value.messages.push(message);
          } else {
            //退出房间
            currentRoom.value.onlineUsers.users.forEach((user, index) => {
              if (event.id === user.id) {
                // 删除当前聊天室列表中离线的用户
                let offlineUser = currentRoom.value.onlineUsers.users.splice(index, 1);
                let message = {
                  content: " 退出房间",
                  senderUserId: offlineUser[0].id,
                  senderNickname: offlineUser[0].nickname,
                  type: MessageType.CHAT
                };
                currentRoom.value.messages.push(message);
              }
            });
          }
          scrollToBottom()
        });
      },
      onSuccess: function () {
        console.log("用户上下线监听成功")
      },
      onFailed: function (error) {
        if (error.code === 401) {
          console.log("监听用户上下线失败,默认不开通，付费应用，可以在我的应用->查看详情，高级功能里自助开通");
        } else {
          console.log("监听用户上下线失败, code:" + error.code + ",content:" + error.content);
        }
      }
    })
  }

  // 监听新消息
  const listenNewMessage = () => {
    // 监听当前聊天室的消息
    let roomId = currentRoom.value.roomId;
    goEasy.pubsub.subscribe({
      channel: roomId,
      onMessage: (message) => {
        let messageContent = "";
        let content = JSON.parse(message.content);
        //聊天消息
        if (content.type === MessageType.CHAT) {
          messageContent = content.content;
        }
        //道具消息
        if (content.type === MessageType.PROP) {
          if (content.content === Prop.ROCKET) {
            messageContent = "送出了一枚大火箭";
          }
          if (content.content === Prop.HEART) {
            messageContent = "送出了一个大大的比心";
          }
        }
        //添加消息
        let newMessage = {
          content: messageContent,
          senderUserId: content.senderUserId,
          senderNickname: content.senderNickname,
          type: MessageType.CHAT
        };
        currentRoom.value.messages.push(newMessage);
        if (content.type === MessageType.PROP) {
          propAnimation(parseInt(content.content))
        }
        scrollToBottom()
      },
      onSuccess: function () {
        console.log("监听新消息成功")
      },
      onFailed: function (error) {
        console.log("订阅消息失败, code:" + error.code + ",错误信息:" + error.content);
      }
    })
  }

  // 加载在线用户列表
  const loadOnlineUsers = () => {
    let roomId = currentRoom.value.roomId;
    goEasy.pubsub.hereNow({
      channels: [roomId],
      includeUsers: true,
      distinct: true,
      onSuccess: function (result) {
        let users = [];
        let currentRoomOnlineUsers = result.content.channels[roomId];
        currentRoomOnlineUsers.users.forEach(function (onlineUser) {
          let userData = onlineUser.data;
          let user = {
            id: onlineUser.id,
            nickname: userData.nickname,
            avatar: userData.avatar
          };
          users.push(user);
        });
        currentRoom.value.onlineUsers = {
          users: users,
          count: currentRoomOnlineUsers.clientAmount
        };
      },
      onFailed: function (error) {
        //获取失败
        if (error.code === 401) {
          console.log("获取在线用户失败,默认不开通，付费应用，可以在我的应用->查看详情，高级功能里自助开通");
        } else {
          console.log("获取在线用户失败, code:" + error.code + ",错误信息:" + error.content);
        }
      }
    })
  }

  // 加载最后10条消息历史
  const loadHistory = () => {
    let roomId = currentRoom.value.roomId;
    goEasy.pubsub.history({
      channel: roomId, //必需项
      limit: 10, //可选项，返回的消息条数
      onSuccess: function (response) {
        let messages = [];
        response.content.messages.map(message => {
          let historyMessage = JSON.parse(message.content);
          //道具消息
          if (historyMessage.type === MessageType.PROP) {
            if (historyMessage.content === Prop.ROCKET) {
              historyMessage.content = "送出了一枚大火箭";
            }
            if (historyMessage.content === Prop.HEART) {
              historyMessage.content = "送出了一个大大的比心";
            }
          }
          messages.push(historyMessage);
        });
        currentRoom.value.messages = messages;
      },
      onFailed: function (error) {
        //获取失败
        if (error.code === 401) {
          console.log("获取历史消息失败,默认不开通，付费应用，可以在我的应用->查看详情，高级功能里自助开通");
        } else {
          console.log("获取历史消息失败, code:" + error.code + ",错误信息:" + error.content);
        }
      }
    });
  }

  const sendMessageByEnter = (event) => {
    newMessageContent.value = event.detail.value;
    sendMessage(MessageType.CHAT, newMessageContent);
  }

  const onInputMessage = (event) => {//双向绑定消息 兼容
    nextTick(() => {
      newMessageContent.value = event.detail.value;
    })
  }

  const sendMessage = (messageType, content) => {
    //发送消息
    if (messageType === MessageType.CHAT) {
      content = newMessageContent.value
      if (!newMessageContent.value) {
        return
      }
    }
    let message = {
      senderNickname: currentRoom.value.currentUser.nickname,
      senderUserId: currentRoom.value.currentUser.id,
      type: messageType,
      content: content
    };
    goEasy.pubsub.publish({
      channel: currentRoom.value.roomId,
      message: JSON.stringify(message),
      onSuccess: function () {
        console.log("发送成功");
      },
      onFailed: function (error) {
        console.log("消息发送失败，错误编码：" + error.code + " 错误信息：" + error.content);
      }
    });
    newMessageContent.value = "";
  }

  const propAnimation = (type) => {//道具动画
    //动画的实现，可以不用关心
    if (propDisplay.value.timer) {
      return;
    }
    propDisplay.value.showPropType = type;
    propDisplay.value.play = true;
    propDisplay.value.timer = setTimeout(() => {
      propDisplay.value.play = false;
      propDisplay.value.timer = null;
    }, 2000)
  }

  const quitRoom = () => {
    goEasy.disconnect({
      onSuccess() {
        router.replace({path: '/pages/index/index'});
        console.log("GoEasy disconnect successfully");
      },
      onFailed(error) {
        console.log("GoEasy disconnect failed" + JSON.stringify(error));
      }
    });
  }

  const scrollToBottom = () => {
    nextTick(() => {
      uni.pageScrollTo({
        scrollTop: 2000000,
        duration: 10
      })
    })
  }
</script>

<style>
  page {
    height: 100%;;
  }

  uni-page-body {
    height: 100%;;
  }

  .chat-room {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .header {
    height: 80rpx;
    line-height: 80rpx;
    text-align: center;
    position: fixed;
    width: 100%;
    top: 0;
    background: #ffffff;
  }

  .quit-btn {
    position: absolute;
    left: 60rpx;
  }

  .online-avatar-container {
    position: fixed;
    top: 80rpx;
    right: 0;
    width: 100%;
    height: 80rpx;
    display: flex;
    justify-content: flex-end;
    padding: 28rpx;
    box-shadow: 10rpx 30rpx 50rpx #fff;
    z-index: 40;
    background: #ffffff;
  }

  .online-avatar-item {
    width: 80rpx;
    height: 80rpx;
    border-radius: 40rpx;
    text-align: center;
    line-height: 80rpx;
    background: rgba(51, 51, 51, 0.3);
    color: #fff;
    font-size: 18rpx 28rpx;
  }

  .online-count {
    width: 80rpx;
    height: 80rpx;
    border-radius: 40rpx;
    text-align: center;
    line-height: 80rpx;
    background: rgba(51, 51, 51, 0.3);
    color: #fff;
    font-size: 28rpx;
  }

  .online-avatar-item image {
    width: 80rpx;
    height: 80rpx;
  }

  .chat-room-container {
    padding-top: 100rpx;
  }

  .scroll-view {
    padding: 100rpx 38rpx 130rpx 38rpx;
    -webkit-overflow-scrolling: touch;
  }

  .message-box {
    margin-top: 16rpx;
  }

  .message-item {
    height: 72rpx;
    background-color: rgba(196, 196, 196, 0.2);
    display: inline-block;
    font-size: 28rpx;
    border-radius: 100rpx;
    padding: 18rpx 30rpx;
  }

  .user-name {
    color: #D02129;
  }

  .user-message {
    color: #333;
  }

  .chat-room-input {
    position: fixed;
    bottom: 0;
    height: 92rpx;
    line-height: 92rpx;
    padding: 10rpx 28rpx 20rpx 28rpx;
    display: flex;
    background: #ffffff;
  }

  .uni-input {
    width: 448rpx;
    background-color: rgba(51, 51, 51, 0.1);
    border-radius: 100rpx;
    padding: 26rpx 40rpx;
    font-size: 28rpx;
  }

  .uni-btn {
    position: absolute;
    z-index: 1000;
    width: 72rpx;
    height: 72rpx;
    background: #D02129;
    right: 10rpx;
    top: 10rpx;
    border-radius: 72rpx;
    text-align: center;
    line-height: 72rpx;
    color: #fff;
    font-weight: bold;
    font-size: 32rpx;
  }

  .heart {
    width: 80rpx;
    height: 92rpx;
    padding: 0 15rpx;
  }

  .rocket {
    width: 40rpx;
    height: 92rpx;
  }

  .self {
    color: #D02129;
  }

  .show-animation {
    width: 80rpx;
    height: 320rpx;
    position: fixed;
    z-index: 44;
    left: 50%;
    bottom: 80rpx;
    margin: 0 -40rpx;
    justify-content: flex-end;
    animation: myanimation 2s linear;
  }

  .prop-heart {
    height: 80rpx;
    width: 80rpx;
  }

  .prop-rocket {
    height: 160rpx;
    width: 80rpx;
  }

  @keyframes myanimation {
    from {
      bottom: 80rpx;
    }
    to {
      bottom: 600rpx;
    }
  }

</style>
