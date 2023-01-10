<template>
  <view class="chat-room">
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
            <text :class="message.senderUserId == currentRoom.currentUser.id ? 'user-message self' : 'user-message' ">
              {{ message && message.content }}
            </text>
          </view>
        </view>
      </view>
      <view class="chat-room-input">
        <view style="position: relative;">
          <input class="uni-input" :value="newMessageContent" placeholder="说点什么..." @input="onInputMessage"/>
          <view class="uni-btn" @click="sendMessage(MessageType.CHAT, newMessageContent)">↑</view>
        </view>
        <image class="heart" @click="sendMessage(MessageType.PROP, Prop.HEART)"
               src="/static/images/handle-heart.png"></image>
        <image class="rocket" @click="sendMessage(MessageType.PROP, Prop.ROCKET)"
               src="/static/images/rocket.png"></image>
      </view>
    </view>
    <view class="show-animation" v-if="propDisplay.play">
      <view v-if="propDisplay.showPropType == Prop.HEART">
        <image class="prop-heart" v-for="(value, key) in 4" :key="key" src="/static/images/heart.png"></image>
      </view>
      <view v-if="propDisplay.showPropType == Prop.ROCKET">
        <image class="prop-rocket" src="/static/images/rocket.png"></image>
      </view>
    </view>
  </view>
</template>

<script>
  export default {
    data() {
      return {
        currentRoom: null,
        // 道具展示
        propDisplay: {
          showPropType: 0,
          play: false,
          timer: null
        },
        newMessageContent: "",
        // 道具类型
        Prop: {
          HEART: 0,//桃心
          ROCKET: 1//火箭
        },
        // 消息类型
        MessageType: {
          CHAT: 0,//文字聊天
          PROP: 1//道具
        }
      }
    },
    onLoad(options) {
      //获取数据
      let roomToken = JSON.parse(options.roomToken);
      // 初始化room
      this.currentRoom = {
        roomId: roomToken.roomId,
        roomName: roomToken.roomName,
        onlineUsers: {
          count: 0,
          users: []
        },
        messages: [],
        currentUser: {
          id: roomToken.userId,
          nickname: roomToken.nickname,
          avatar: roomToken.avatar
        }
      };
      // 设置导航标题
      uni.setNavigationBarTitle({
        title: roomToken.roomName
      });

      // 连接goEasy
      this.connectGoEasy();

      // 监听用户上下线
      this.listenUsersOnlineOffline();


      // 加载最后10条消息历史
      this.loadHistory();

      // 监听新消息
      this.listenNewMessage();


    },
    onUnload() {
      // 断开连接
      this.goEasy.disconnect({
        onSuccess() {
          console.log("GoEasy disconnect successfully");
        },
        onFailed(error) {
          console.log("GoEasy disconnect failed" + JSON.stringify(error));
        }
      });
    },
    methods: {
      // 连接goEasy
      connectGoEasy() {
        let self = this;
        let userData = {
          avatar: this.currentRoom.currentUser.avatar,
          nickname: this.currentRoom.currentUser.nickname
        }
        this.goEasy.connect({
          id: this.currentRoom.currentUser.id,
          data: userData,
          onSuccess: function () {
            console.log("GoEasy connect successfully.")

            // 加载在线用户列表
            self.loadOnlineUsers();
          },
          onFailed: function (error) {
            console.log("Failed to connect GoEasy, code:" + error.code + ",error:" + error.content);
          },
          onProgress: function (attempts) {
            console.log("GoEasy is connecting", attempts);
          }
        });
      },
      // 监听用户上下线
      listenUsersOnlineOffline() {
        let self = this;
        let roomId = this.currentRoom.roomId;
        this.goEasy.pubsub.subscribePresence({
          channel: roomId,
          onPresence: function (presenceEvents) {
            self.currentRoom.onlineUsers.count = presenceEvents.clientAmount;
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
                self.currentRoom.onlineUsers.users.push(user);
                //添加进入房间的消息
                let message = {
                  content: " 进入房间",
                  senderUserId: userId,
                  senderNickname: nickname,
                  type: self.MessageType.CHAT
                };
                self.currentRoom.messages.push(message);
              } else {
                //退出房间
                self.currentRoom.onlineUsers.users.forEach((user, index) => {
                  if (event.id === user.id) {
                    // 删除当前聊天室列表中离线的用户
                    let offlineUser = self.currentRoom.onlineUsers.users.splice(index, 1);
                    let message = {
                      content: " 退出房间",
                      senderUserId: offlineUser[0].id,
                      senderNickname: offlineUser[0].nickname,
                      type: self.MessageType.CHAT
                    };
                    self.currentRoom.messages.push(message);
                  }
                });
              }
              self.scrollToBottom();
            });
          },
          onSuccess: function () {
            console.log("用户上下线监听成功")
          },
          onFailed: function (error) {
            console.log("监听用户上下线失败, code:" + error.code + ",content:" + error.content);
          }
        })
      },
      // 监听新消息
      listenNewMessage() {
        // 监听当前聊天室的消息
        let self = this;
        let roomId = this.currentRoom.roomId;
        this.goEasy.pubsub.subscribe({
          channel: roomId,
          onMessage: function (message) {
            let messageContent = "";
            let content = JSON.parse(message.content);
            //聊天消息
            if (content.type === self.MessageType.CHAT) {
              messageContent = content.content;
            }
            //道具消息
            if (content.type === self.MessageType.PROP) {
              if (content.content === self.Prop.ROCKET) {
                messageContent = "送出了一枚大火箭";
              }
              if (content.content === self.Prop.HEART) {
                messageContent = "送出了一个大大的比心";
              }
            }
            //添加消息
            let newMessage = {
              content: messageContent,
              senderUserId: content.senderUserId,
              senderNickname: content.senderNickname,
              type: self.MessageType.CHAT
            };
            self.currentRoom.messages.push(newMessage);
            if (content.type === self.MessageType.PROP) {
              self.propAnimation(parseInt(content.content))
            }
            self.scrollToBottom();
          },
          onSuccess: function () {
            console.log("监听新消息成功")
          },
          onFailed: function (error) {
            console.log("订阅消息失败, code:" + error.code + ",错误信息:" + error.content);
          }
        })
      },
      // 加载在线用户列表
      loadOnlineUsers() {
        let self = this;
        let roomId = this.currentRoom.roomId;
        this.goEasy.pubsub.hereNow({
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
            self.currentRoom.onlineUsers = {
              users: users,
              count: currentRoomOnlineUsers.clientAmount
            };
          },
          onFailed: function (error) {
            //获取失败
            console.log("获取在线用户失败, code:" + error.code + ",错误信息:" + error.content);
          }
        });
      },
      // 加载最后10条消息历史
      loadHistory() {
        let self = this;
        let roomId = this.currentRoom.roomId;
        this.goEasy.pubsub.history({
          channel: roomId, //必需项
          limit: 10, //可选项，返回的消息条数
          onSuccess: function (response) {
            let messages = [];
            response.content.messages.map(message => {
              let historyMessage = JSON.parse(message.content);
              //道具消息
              if (historyMessage.type === self.MessageType.PROP) {
                if (historyMessage.content === self.Prop.ROCKET) {
                  historyMessage.content = "送出了一枚大火箭";
                }
                if (historyMessage.content === self.Prop.HEART) {
                  historyMessage.content = "送出了一个大大的比心";
                }
              }
              messages.push(historyMessage);
            });
            self.currentRoom.messages = messages;
          },
          onFailed: function (error) {
            console.log("获取历史消息失败, code:" + error.code + ",错误信息:" + error.content);
          }
        });
      },
      onInputMessage(event) {//双向绑定消息 兼容
        this.newMessageContent = event.target.value;
      },
      sendMessage(messageType, content) {
        //发送消息
        if (content === "" && messageType === this.MessageType.CHAT) {
          return;
        }
        let message = {
          senderNickname: this.currentRoom.currentUser.nickname,
          senderUserId: this.currentRoom.currentUser.id,
          type: messageType,
          content: content
        };
        this.goEasy.pubsub.publish({
          channel: this.currentRoom.roomId,
          message: JSON.stringify(message),
          onSuccess: function () {
            console.log("发送成功");
          },
          onFailed: function (error) {
            console.log("消息发送失败，错误编码：" + error.code + " 错误信息：" + error.content);
          }
        });
        this.newMessageContent = "";
      },
      propAnimation(type) {//道具动画
        //动画的实现
        if (this.propDisplay.timer) {
          return;
        }
        this.propDisplay.showPropType = type;
        this.propDisplay.play = true;
        this.propDisplay.timer = setTimeout(() => {
          this.propDisplay.play = false;
          this.propDisplay.timer = null;
        }, 2000)
      },
      scrollToBottom() {
        this.$nextTick(function () {
          uni.pageScrollTo({
            scrollTop: 2000000,
            duration: 10
          })
        })
      },
    }
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

  .online-avatar-container {
    position: fixed;
    right: 0;
    width: 100%;
    height: 80 rpx;
    display: flex;
    justify-content: flex-end;
    padding: 28 rpx;
    box-shadow: 10 rpx 30 rpx 50 rpx #fff;
    z-index: 40;
    background: #ffffff;
  }

  .online-avatar-item {
    width: 80 rpx;
    height: 80 rpx;
    border-radius: 40 rpx;
    text-align: center;
    line-height: 80 rpx;
    background: rgba(51, 51, 51, 0.3);
    color: #fff;
    font-size: 18 rpx 28 rpx;
  }

  .online-count {
    width: 80 rpx;
    height: 80 rpx;
    border-radius: 40 rpx;
    text-align: center;
    line-height: 80 rpx;
    background: rgba(51, 51, 51, 0.3);
    color: #fff;
    font-size: 28 rpx;
  }

  .online-avatar-item image {
    width: 80 rpx;
    height: 80 rpx;
  }

  .chat-room-container {
    padding-top: 100 rpx;
  }

  .scroll-view {
    overflow-y: auto;
    padding: 20 rpx 38 rpx 130 rpx 38 rpx;
    box-sizing: border-box;
    -webkit-overflow-scrolling: touch;
  }

  .message-box {
    margin-top: 16 rpx;
  }

  .message-item {
    box-sizing: border-box;
    height: 72 rpx;
    background-color: rgba(196, 196, 196, 0.2);
    display: inline-block;
    font-size: 28 rpx;
    border-radius: 100 rpx;
    padding: 18 rpx 30 rpx;
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

  .chat-room-input {
    position: fixed;
    bottom: 0;
    height: 92 rpx;
    line-height: 92 rpx;
    padding: 10 rpx 28 rpx 20 rpx 28 rpx;
    display: flex;
    background: #ffffff;
  }

  .uni-input {
    width: 528 rpx;
    background-color: rgba(51, 51, 51, 0.1);
    height: 92 rpx;
    border-radius: 100 rpx;
    box-sizing: border-box;
    padding: 26 rpx 40 rpx;
    font-size: 28 rpx;
  }

  .uni-btn {
    position: absolute;
    z-index: 1000;
    width: 72 rpx;
    height: 72 rpx;
    background: #D02129;
    right: 10 rpx;
    top: 10 rpx;
    border-radius: 72 rpx;
    text-align: center;
    line-height: 72 rpx;
    color: #fff;
    font-weight: bold;
    font-size: 32 rpx;
  }

  .heart {
    width: 80 rpx;
    height: 92 rpx;
    padding: 0 15 rpx;
  }

  .rocket {
    width: 40 rpx;
    height: 92 rpx;
  }

  .self {
    color: #D02129;
  }

  .show-animation {
    width: 80 rpx;
    height: 320 rpx;
    position: fixed;
    z-index: 44;
    left: 50%;
    bottom: 80 rpx;
    margin: 0 -40 rpx;
    justify-content: flex-end;
    animation: myanimation 2s linear;
  }

  .prop-heart {
    height: 80 rpx;
    width: 80 rpx;
  }

  .prop-rocket {
    height: 160 rpx;
    width: 80 rpx;
  }

  @keyframes myanimation {
    from {
      bottom: 80 rpx;
    }
    to {
      bottom: 600 rpx;
    }
  }

</style>
