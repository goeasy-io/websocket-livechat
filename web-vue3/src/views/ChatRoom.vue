<template>
  <div class="chat-room">
    <div class="chat-container">
      <div class="header">
        <span class="quit-btn" @click="quitRoom">X</span>
        <div>{{ currentRoom.roomName }}</div>
      </div>
      <div class="online-avatar-container">
        <div class="online-avatar-item" v-for="(user, key) in currentRoom.onlineUsers.users"
             :key="key"
             :style="realignAvatar(key)">
          <img :src="baseUrl+user.avatar"/>
        </div>
        <div class="online-count">{{ currentRoom.onlineUsers.users.length }}</div>
      </div>
      <div class="chat-room-container">
        <div class="chat-room-content" ref="myscroll">
          <div class="message-box" v-for="(message, key) in currentRoom.messages"
               :key="key"
               :id="'message-box'+ key">
            <div class="message-item">
              <span class="user-name">{{ message && message.senderNickname }}:</span>
              <span :class="message.senderUserId == currentRoom.currentUser.id ? 'user-message self' : 'user-message' ">
                            {{ message && message.content }}
                        </span>
            </div>
          </div>
        </div>
        <div class="chat-room-action">
          <div class="message-input-box">
            <input class="message-input" :value="newMessageContent"
                   placeholder="说点什么..."
                   @input="onInputMessage"/>
            <div class="message-btn" @click="sendMessage(MessageType.CHAT, newMessageContent)">↑</div>
          </div>
          <img class="heart" @click="sendMessage(MessageType.PROP, Prop.HEART)"
               src="../../public/static/images/handle-heart.png">
          <img class="rocket" @click="sendMessage(MessageType.PROP, Prop.ROCKET)"
               src="../../public/static/images/rocket.png">
        </div>
      </div>
      <div class="show-animation" v-if="propDisplay.play">
        <div class="prop-hearts" v-if="propDisplay.showPropType === Prop.HEART">
          <img class="prop-heart" v-for="img in 4" :key="img" src="../../public/static/images/heart.png">
        </div>
        <img class="prop-rocket" src="../../public/static/images/rocket.png" v-if="propDisplay.showPropType === Prop.ROCKET">
      </div>
    </div>
  </div>
</template>

<script setup>
  import {ref, onMounted, onBeforeUnmount, inject, nextTick} from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  const baseUrl = process.env.BASE_URL

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

  let myscroll = ref();

  onMounted(() => {
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

  onBeforeUnmount(() => {
    quitRoom();
  })

  // 连接goEasy
  function connectGoEasy() {
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
  function listenUsersOnlineOffline() {
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
          nextTick(() => {
            myscroll.value.scrollTo(0, myscroll.value.scrollHeight)
          })
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
  function listenNewMessage() {
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
        nextTick(() => {
          myscroll.value.scrollTo(0, myscroll.value.scrollHeight)
        })
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
  function loadOnlineUsers() {
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
  function loadHistory() {
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

  function realignAvatar(key) {//排列头像
    let len = currentRoom.value.onlineUsers.users.length - 1;
    if (key !== len) {
      let p = (len - key + 1) * 0.1 + 'rem';
      return {
        transform: 'translateX(' + p + ')',
        zIndex: 100 - key
      }
    }
  }

  function onInputMessage(event) {//双向绑定消息 兼容
    newMessageContent = event.target.value;
  }

  function sendMessage(messageType, content) {
    //发送消息
    if (content === "" && messageType === MessageType.CHAT) {
      return;
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
    newMessageContent = "";
  }

  function propAnimation(type) {//道具动画
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

  function quitRoom() {
    goEasy.disconnect({
      onSuccess() {
        router.replace({path: '/index'});
        console.log("GoEasy disconnect successfully");
      },
      onFailed(error) {
        console.log("GoEasy disconnect failed" + JSON.stringify(error));
      }
    });
  }
</script>

<style scoped>
  .chat-room {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chat-container {
    width: 850px;
    height: 450px;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .header {
    height: 44px;
    line-height: 44px;
    text-align: center;
    position: relative;
  }

  .quit-btn {
    position: absolute;
    left: 30px;
  }

  .online-avatar-container {
    position: absolute;
    top: 44px;
    right: 0;
    width: 100%;
    height: 40px;
    display: flex;
    justify-content: flex-end;
    padding: 14px;
    box-shadow: 5px 15px 25px #fff;
    z-index: 40;
    background: #ffffff;
  }

  .online-avatar-item {
    width: 40px;
    height: 40px;
    border-radius: 20px;
    text-align: center;
    line-height: 40px;
    background: rgba(51, 51, 51, 0.3);
    color: #fff;
    font-size: 9px 14px;
  }

  .online-count {
    width: 40px;
    height: 40px;
    border-radius: 20px;
    text-align: center;
    line-height: 40px;
    background: rgba(51, 51, 51, 0.3);
    color: #fff;
    font-size: 14px;
  }

  .online-avatar-item img {
    width: 40px;
    height: 40px;
  }

  .chat-room-container {
    padding-top: 50px;
    flex: 1;
  }

  .chat-room-content {
    height: 300px;
    overflow-y: auto;
    padding: 8px 15px 20px 15px;
    box-sizing: border-box;
  }

  .message-box {
    margin-top: 8px;
  }

  .message-item {
    box-sizing: border-box;
    height: 36px;
    background-color: rgba(196, 196, 196, 0.2);
    display: inline-block;
    font-size: 14px;
    border-radius: 50px;
    padding: 9px 15px;
    font-family: Microsoft YaHei UI;
  }

  .user-name {
    color: #D02129;
    font-family: Microsoft YaHei UI;
  }

  .user-message {
    color: #333;
    font-family: Microsoft YaHei UI;
  }

  .chat-room-action {
    position: fixed;
    bottom: 0;
    width: 820px;
    height: 52px;
    line-height: 36px;
    padding: 4px 15px 8px 15px;
    display: flex;
    background: #ffffff;
  }

  .message-input {
    width: 740px;
    background-color: rgba(51, 51, 51, 0.1);
    height: 40px;
    border-radius: 50px;
    box-sizing: border-box;
    padding: 13px 20px;
    font-size: 14px;
    outline: none;
    border: none;
  }

  .message-btn {
    position: absolute;
    z-index: 1000;
    width: 33px;
    height: 33px;
    background: #D02129;
    right: 70px;
    top: 7px;
    border-radius: 36px;
    text-align: center;
    line-height: 36px;
    color: #fff;
    font-weight: bold;
    font-size: 16px;
  }

  .heart {
    width: 50px;
    height: 46px;
    padding: 0 7.5px;
  }

  .rocket {
    width: 20px;
    height: 46px;
  }

  .self {
    color: #D02129;
  }

  .show-animation {
    width: 40px;
    height: 160px;
    position: fixed;
    z-index: 44;
    left: 50%;
    bottom: 40px;
    margin: 0 -20px;
    justify-content: flex-end;
    animation: myanimation 2s linear;
  }

  .prop-heart {
    height: 40px;
    width: 40px;
  }

  .prop-rocket {
    height: 80px;
    width: 40px;
  }

  @keyframes myanimation {
    from {
      bottom: 40px;
    }
    to {
      bottom: 300px;
    }
  }
</style>
