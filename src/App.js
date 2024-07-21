import logo from './logo.svg';
import './App.css';
import io from "socket.io-client";
import { Button, Checkbox, Form, Input, Flex, Layout, Radio, Avatar, List, message } from 'antd';
import { useEffect, useState } from "react";
import axios from "axios";
const { Header, Footer, Sider, Content } = Layout;

const headerStyle = {
  textAlign: 'center',
  color: '#fff',
  height: 64,
  paddingInline: 48,
  lineHeight: '64px',
  backgroundColor: '#4096ff',
};
const contentStyle = {
  textAlign: 'center',
  minHeight: 120,
  lineHeight: '120px',
  color: '#fff',
  backgroundColor: '#ffffff',
};
const siderStyle = {
  textAlign: 'center',
  lineHeight: '120px',
  color: '#fff',
  backgroundColor: '#ffffff',
};
const footerStyle = {
  textAlign: 'center',
  color: '#fff',
  backgroundColor: '#4096ff',
};
const layoutStyle = {
  borderRadius: 8,
  overflow: 'hidden',
  width: 'calc(100% - 16px)',
  maxWidth: 'calc(100% - 16px)',
  marginLeft: 'auto',
  marginRight: 'auto',
  borderStyle: 'solid',
  borderColor: 'rgb(180,180,180)',
};

function App() {

  const [quizId, setQuizId] = useState("");
  const [userId, setUserId] = useState("");
  const [afterLogin, setAfterLogin] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [leaderBoardUsers, setLeaderBoardUsers] = useState([]);
  const [msg, contextHolder] = message.useMessage();

  useEffect(() => {
    // get quiz info
    if (quizId) {
      fetchQuizData(quizId);
      fetchLeaderBoardData(quizId);
    }
  }, [quizId]);

  const fetchQuizData = async (quizId) => {
    // Send an HTTP GET request to the specified URL
    const response = await axios.get(
      `${process.env.REACT_APP_SERVER_ENDPOINT}/quiz/quizs?roomId=${quizId}`
    );

    // Log the response from the API to the console
    console.log("fetchQuizData response", response);

    // Update the 'data' state with the data from the API response
    if (response.data?.questions) {
      setQuestions(response.data?.questions);
      setAfterLogin(true);
      msg.open({
        type: 'success',
        content: 'Login success',
      });
    } else {
      setQuestions([]);
      setAfterLogin(false);
      msg.open({
        type: 'error',
        content: 'Data not found',
      });
    }
  };

  const fetchLeaderBoardData = async (quizId) => {
    // Send an HTTP GET request to the specified URL
    const response = await axios.get(
      `${process.env.REACT_APP_SERVER_ENDPOINT}/leader-board/get-leader-board?quizId=${quizId}`
    );

    // Log the response from the API to the console
    console.log("fetchLeaderBoardData response", response);

    // Update the 'data' state with the data from the API response
    setLeaderBoardUsers(response.data || []);
  };

  const onFinish = (values) => {
    console.log('Success:', values);
    setQuizId(values.quizId);
    setUserId(values.userId);
  };
  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const onFinishQuiz = (values) => {
    console.log('Success quiz:', values);
    axios.post(`${process.env.REACT_APP_SERVER_ENDPOINT}/score/submit-answers`, {
      quizId,
      userId,
      questionsAndAnswersMap: {},
    });
  };
  const onFinishFailedQuiz = (errorInfo) => {
    console.log('Failed quiz:', errorInfo);
  };

  const onUpdateBoard = (data) => {
    console.log('update_leader_board data', data);
    // update leader board
    const {userId, totalScore} = data;
    
    // filter out this userId
    console.log('leaderBoardUsers', JSON.stringify(leaderBoardUsers));
    console.log('leaderBoardUsers length', leaderBoardUsers.length);
    console.log('userId', userId);
    const filteredBoard = leaderBoardUsers.filter(user => user.userId != userId);
    console.log('filteredBoard', JSON.stringify(filteredBoard));
    console.log('filteredBoard length', filteredBoard.length);
    filteredBoard.push({quizId, userId, point: totalScore});
    filteredBoard.sort((a,b) => b.point - a.point);
    console.log('filteredBoard2', JSON.stringify(filteredBoard));
    console.log('filteredBoard2 length', filteredBoard.length);
    setLeaderBoardUsers([...filteredBoard]);
  };

  useEffect(() => {
    if (afterLogin) {
      const socket = io.connect(`${process.env.REACT_APP_SOCKET_ENDPOINT}?quizId=${quizId}`);
  
      socket.on('update_leader_board', onUpdateBoard);

      return () => {
        socket.off('update_leader_board', onUpdateBoard);
      };
    }
  }, [afterLogin, leaderBoardUsers]);

  return (
    <>
      <br />
      {contextHolder}

      {/* test screen */}
      { afterLogin && 
        <>
          <Layout style={layoutStyle}>
            <Header style={headerStyle}>Quiz 「{quizId}」 test for User 「{userId}」</Header>
            <Layout>
              <Content style={contentStyle}>
                <Form
                  name="basic"
                  labelCol={{
                    span: 8,
                  }}
                  wrapperCol={{
                    span: 16,
                  }}
                  style={{
                    maxWidth: 600,
                  }}
                  initialValues={{
                    remember: true,
                  }}
                  onFinish={onFinishQuiz}
                  onFinishFailed={onFinishFailedQuiz}
                  autoComplete="off"
                >
                  <br />
                  Quiz content :
                  {questions.map((question, i) => 
                    <div key={i}>
                      <Form.Item label={"Question"+(i+1)}>
                        {question.question}
                      </Form.Item>
                      <Form.Item 
                        label="Radio"
                        name={"Ans"+(i+1)}
                        rules={[
                          {
                            required: true,
                            message: 'Please input your answer!',
                          },
                        ]}
                      >
                        <Radio.Group>
                          <Radio value="ansA">{question.ansA}</Radio>
                          <Radio value="ansB">{question.ansB}</Radio>
                          <Radio value="ansC">{question.ansC}</Radio>
                          <Radio value="ansD">{question.ansD}</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </div>
                  )}

                  <Form.Item
                    wrapperCol={{
                      offset: 8,
                      span: 16,
                    }}
                  >
                    <Button type="primary" htmlType="submit">
                      Submit
                    </Button>
                  </Form.Item>
                </Form>
              </Content>
              <Sider width="50%" style={siderStyle}>
                <div style={{color: "black"}}>Leader board <br/></div>
                <List
                  itemLayout="horizontal"
                  style={{border: 'solid', borderColor: 'gray', marginRight: 10, paddingLeft: 10}}
                  dataSource={leaderBoardUsers}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=1`} />}
                        title={`User: ${item.userId}`}
                        description={`Point: ${item.point}`}
                      />
                    </List.Item>
                  )}
                />
              </Sider>
            </Layout>
            {/* <Footer style={footerStyle}>Footer</Footer> */}
          </Layout>
        </>
      }

      {/* login screen */}
      { !afterLogin && 
        <Form
          name="basic"
          labelCol={{
            span: 8,
          }}
          wrapperCol={{
            span: 16,
          }}
          style={{
            maxWidth: 600,
          }}
          initialValues={{
            remember: true,
          }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="Quiz Id"
            name="quizId"
            rules={[
              {
                required: true,
                message: 'Please input your quiz id!',
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="User Id"
            name="userId"
            rules={[
              {
                required: true,
                message: 'Please input your user id!',
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            wrapperCol={{
              offset: 8,
              span: 16,
            }}
          >
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      }
    </>
  );
}

export default App;
