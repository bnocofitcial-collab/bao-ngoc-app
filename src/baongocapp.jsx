import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock, ChevronLeft, ChevronRight, XCircle, Volume2,
  Grip, Target, Award, Zap, Bookmark, BookmarkCheck,
  CheckCircle, AlertCircle, Loader2, ZoomIn, ZoomOut, Type,
  PlayCircle, PauseCircle, Layers, BookOpen
} from 'lucide-react';

// ==========================================
// FIREBASE IMPORTS 
// ==========================================
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const apiKey = "";
const appId = typeof __app_id !== 'undefined' ? __app_id : 'exam-factory-pro-app';
const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;

let app, auth, db;
if (firebaseConfigStr) {
  try {
    const firebaseConfig = JSON.parse(firebaseConfigStr);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase init failed", e);
  }
}

// ==========================================
// DEFAULT DATA: ĐỀ THI VÀO 10 CHUẨN (50 CÂU) 
// GIẢI THÍCH CHI TIẾT 3 PHẦN
// ==========================================
const defaultPassages = {
  cloze1: `Living in a city has a number of drawbacks. Firstly, there is the problem of traffic jams and traffic accidents. The increase (28) _____ population and the increasing number of vehicles have caused many accidents to happen every day. Secondly, air pollution negatively affects people’s health, and it also has a bad influence (29) _____ the environment. More and more city dwellers suffer from coughing or breathing problems. Thirdly, the city is noisy, even at night. Noise pollution comes from the traffic and from construction sites. Buildings are always being knocked (30) _____ and rebuilt. These factors contribute to making city life (31) _____ difficult for its residents. However, many people still prefer living in the city because of the (32) _____ of job opportunities and modern facilities.`,
  reading1: `The Internet has increasingly developed and become part of our everyday life. For many, the Internet is a very fast and convenient way to get information. People can also communicate with friends and relatives by means of e-mail or chatting. It makes our world a small village. \n\nIn addition to its benefits, the Internet also has limitations. It is time-consuming and costly. It is also dangerous because of viruses and bad programs. Moreover, Internet users sometimes have to suffer various risks such as spam or electronic junk mail, and personal information leaking. So, while enjoying surfing, be alert!`,
  reading2: `Renewable energy sources such as wind, solar, and water power are becoming increasingly important. Unlike fossil fuels, which will eventually run out and cause severe environmental damage, renewable energy is sustainable. Solar panels capture sunlight to generate electricity, while wind turbines use the power of the wind. Although the initial cost of installing these systems can be high, they save money in the long run. Many countries are now investing heavily in green technology to reduce carbon emissions and combat climate change.`
};

const defaultQuizData = [
  { id: 1, type: 'mcq', question: "Choose the word whose underlined part is pronounced differently.", options: ["work<u>ed</u>", "clean<u>ed</u>", "watch<u>ed</u>", "stopp<u>ed</u>"], answer: 1, explain: "<b>✅ Giải thích:</b> 'cleaned' có tận cùng là âm hữu thanh /n/ nên đuôi '-ed' phát âm là /d/.<br/><b>❌ Phân tích:</b> Các từ còn lại tận cùng là âm vô thanh /k/, /tʃ/, /p/ nên '-ed' phát âm là /t/.<br/><b>💡 Ví dụ:</b> <i>He play<b>ed</b> (/d/) vs He kiss<b>ed</b> (/t/).</i>" },
  { id: 2, type: 'mcq', question: "Choose the word whose underlined part is pronounced differently.", options: ["ba<u>th</u>s", "mon<u>th</u>s", "pa<u>th</u>s", "clo<u>th</u>s"], answer: 3, explain: "<b>✅ Giải thích:</b> 'cloths' phát âm 'th' là âm hữu thanh /ðz/.<br/><b>❌ Phân tích:</b> Các từ bath, month, path đều có 'th' phát âm là âm vô thanh /θs/.<br/><b>💡 Ví dụ:</b> <i>This clo<b>th</b> (/ð/) is very soft.</i>" },
  { id: 3, type: 'mcq', question: "Choose the word whose underlined part is pronounced differently.", options: ["c<u>a</u>re", "sh<u>a</u>re", "m<u>a</u>re", "<u>a</u>re"], answer: 3, explain: "<b>✅ Giải thích:</b> 'are' phát âm là /ɑː(r)/ (âm a dài).<br/><b>❌ Phân tích:</b> Care, share, mare đều phát âm nguyên âm là /eə(r)/.<br/><b>💡 Ví dụ:</b> <i>They <b>are</b> (/ɑːr/) sharing (/eə/) the cake.</i>" },
  { id: 4, type: 'mcq', question: "Choose the word that has a different stress pattern.", options: ["enjoy", "happen", "listen", "visit"], answer: 0, explain: "<b>✅ Giải thích:</b> 'enjoy' là động từ 2 âm tiết, trọng âm rơi vào âm tiết số 2.<br/><b>❌ Phân tích:</b> Happen, listen, visit dù là động từ nhưng tận cùng bằng các đuôi yếu (-en, -it) nên trọng âm rơi vào âm tiết 1.<br/><b>💡 Ví dụ:</b> <i>I en'joy listening to music.</i>" },
  { id: 5, type: 'mcq', question: "Choose the word that has a different stress pattern.", options: ["pollution", "computer", "currency", "allowance"], answer: 2, explain: "<b>✅ Giải thích:</b> 'currency' có 3 âm tiết, trọng âm nhấn âm số 1.<br/><b>❌ Phân tích:</b> Pollution (đuôi -tion nhấn trước nó), computer, allowance đều nhấn âm 2.<br/><b>💡 Ví dụ:</b> <i>The local 'currency is the Dong.</i>" },
  { id: 6, type: 'mcq', question: "I wish I _____ speak English as fluently as my brother.", options: ["can", "could", "will", "would"], answer: 1, explain: "<b>✅ Giải thích:</b> Câu ước trái với hiện tại hoặc khả năng ở hiện tại dùng 'could' + V.<br/><b>❌ Phân tích:</b> Không dùng 'can' hoặc 'will' trong câu wish. 'Would' dùng cho mong muốn người khác thay đổi.<br/><b>💡 Ví dụ:</b> <i>I wish I <b>could</b> fly.</i>" },
  { id: 7, type: 'mcq', question: "If the weather _____ good, we will go camping tomorrow.", options: ["is", "was", "will be", "would be"], answer: 0, explain: "<b>✅ Giải thích:</b> Câu điều kiện loại 1 diễn tả sự việc có thể xảy ra ở hiện tại/tương lai: If + S + V(hiện tại), S + will + V.<br/><b>❌ Phân tích:</b> Mệnh đề If không chứa 'will'. 'was' dùng cho điều kiện loại 2.<br/><b>💡 Ví dụ:</b> <i>If it <b>rains</b>, I will stay at home.</i>" },
  { id: 8, type: 'mcq', question: "He asked me where I _____ the previous day.", options: ["go", "went", "have gone", "had gone"], answer: 3, explain: "<b>✅ Giải thích:</b> Câu gián tiếp có 'the previous day' (trước đó là yesterday - Quá khứ đơn), nên phải lùi một thì xuống Quá khứ hoàn thành.<br/><b>❌ Phân tích:</b> 'went' chưa lùi thì. 'have gone' là hiện tại hoàn thành không dùng được ở đây.<br/><b>💡 Ví dụ:</b> <i>She said she <b>had finished</b> her work the day before.</i>" },
  { id: 9, type: 'mcq', question: "The man _____ is standing over there is our new teacher.", options: ["who", "whom", "which", "whose"], answer: 0, explain: "<b>✅ Giải thích:</b> Cần đại từ quan hệ chỉ người, làm chủ ngữ cho động từ 'is standing' -> dùng 'who'.<br/><b>❌ Phân tích:</b> 'whom' làm tân ngữ. 'which' chỉ vật. 'whose' chỉ sở hữu.<br/><b>💡 Ví dụ:</b> <i>The girl <b>who</b> won the prize is my sister.</i>" },
  { id: 10, type: 'mcq', question: "My car _____ yesterday by my uncle.", options: ["repairs", "repaired", "is repaired", "was repaired"], answer: 3, explain: "<b>✅ Giải thích:</b> Có 'yesterday' (quá khứ) và 'by' (bị động) -> Cấu trúc bị động quá khứ đơn: S + was/were + V3/ed.<br/><b>❌ Phân tích:</b> 'is repaired' là bị động hiện tại. 'repaired' là chủ động.<br/><b>💡 Ví dụ:</b> <i>The house <b>was built</b> in 1990.</i>" },
  { id: 11, type: 'mcq', question: "She suggested _____ to the beach for a change.", options: ["to go", "going", "go", "goes"], answer: 1, explain: "<b>✅ Giải thích:</b> Cấu trúc: suggest + V-ing (đề xuất cùng làm một việc gì đó).<br/><b>❌ Phân tích:</b> Không dùng suggest + to V hay động từ nguyên thể trong trường hợp này.<br/><b>💡 Ví dụ:</b> <i>He suggested <b>eating</b> out tonight.</i>" },
  { id: 12, type: 'mcq', question: "We have been friends _____ we were children.", options: ["for", "since", "when", "in"], answer: 1, explain: "<b>✅ Giải thích:</b> Dùng 'since' + mốc thời gian / mệnh đề quá khứ đơn (chỉ điểm bắt đầu).<br/><b>❌ Phân tích:</b> 'for' + khoảng thời gian (for 5 years). 'when' không đi với thì HTHT theo cấu trúc này.<br/><b>💡 Ví dụ:</b> <i>I have lived here <b>since</b> 2010.</i>" },
  { id: 13, type: 'mcq', question: "It’s raining heavily; _____, we can’t go to the park.", options: ["so", "because", "therefore", "but"], answer: 2, explain: "<b>✅ Giải thích:</b> 'therefore' (do đó) được ngăn cách bởi dấu chấm phẩy (;) và dấu phẩy (,).<br/><b>❌ Phân tích:</b> 'so' và 'but' thường đứng sau dấu phẩy (,). 'because' mang nghĩa bởi vì (sai logic ngữ nghĩa).<br/><b>💡 Ví dụ:</b> <i>He was sick; <b>therefore</b>, he stayed home.</i>" },
  { id: 14, type: 'mcq', question: "Please turn _____ the lights before leaving the room.", options: ["on", "off", "up", "down"], answer: 1, explain: "<b>✅ Giải thích:</b> 'turn off' nghĩa là tắt (đèn, thiết bị). Phù hợp với ngữ cảnh rời khỏi phòng.<br/><b>❌ Phân tích:</b> turn on (bật), turn up (vặn to), turn down (vặn nhỏ/từ chối).<br/><b>💡 Ví dụ:</b> <i>Don't forget to <b>turn off</b> the TV.</i>" },
  { id: 15, type: 'mcq', question: "They are looking forward _____ you soon.", options: ["to see", "to seeing", "seeing", "see"], answer: 1, explain: "<b>✅ Giải thích:</b> Cấu trúc: Look forward to + V-ing / Noun (mong đợi điều gì). Từ 'to' ở đây là giới từ, không phải to-infinitive.<br/><b>❌ Phân tích:</b> Rất nhiều học sinh nhầm dùng 'to V' theo thói quen, dẫn đến sai lầm.<br/><b>💡 Ví dụ:</b> <i>I look forward <b>to hearing</b> from you.</i>" },
  { id: 16, type: 'mcq', question: "You should pay more _____ to your teacher's explanation.", options: ["notice", "care", "attention", "focus"], answer: 2, explain: "<b>✅ Giải thích:</b> Cụm từ cố định (Collocation): pay attention to (chú ý tới).<br/><b>❌ Phân tích:</b> Take notice of (chú ý), care about (quan tâm), focus on (tập trung) đi với các giới từ và cụm khác.<br/><b>💡 Ví dụ:</b> <i>Please <b>pay attention to</b> the warning signs.</i>" },
  { id: 17, type: 'mcq', question: "He is tired _____ he stayed up late watching TV.", options: ["so", "because", "although", "but"], answer: 1, explain: "<b>✅ Giải thích:</b> 'Because' (bởi vì) đứng trước mệnh đề chỉ nguyên nhân.<br/><b>❌ Phân tích:</b> 'so' chỉ kết quả. 'although' chỉ sự nhượng bộ (mặc dù).<br/><b>💡 Ví dụ:</b> <i>She is crying <b>because</b> she lost her doll.</i>" },
  { id: 18, type: 'mcq', question: "This is the most interesting book I have _____ read.", options: ["never", "ever", "just", "already"], answer: 1, explain: "<b>✅ Giải thích:</b> 'ever' (đã từng) thường dùng trong câu thì Hiện tại hoàn thành kết hợp với So sánh nhất.<br/><b>❌ Phân tích:</b> 'never' mang nghĩa phủ định. 'already' dùng cho việc đã xong.<br/><b>💡 Ví dụ:</b> <i>It's the best movie I have <b>ever</b> watched.</i>" },
  { id: 19, type: 'mcq', question: "- 'Congratulations on your passing the exam!'\n- '_____' ", options: ["You're welcome.", "Never mind.", "Thanks a lot.", "It's my pleasure."], answer: 2, explain: "<b>✅ Giải thích:</b> Đáp lại lời chúc mừng (Congratulations) lịch sự nhất là nói lời cảm ơn (Thanks a lot).<br/><b>❌ Phân tích:</b> You're welcome / It's my pleasure dùng để đáp lại lời cảm ơn của người khác.<br/><b>💡 Ví dụ:</b> <i>- Happy Birthday! - <b>Thanks a lot!</b></i>" },
  { id: 20, type: 'mcq', question: "- 'Would you like some coffee?'\n- '_____' ", options: ["Yes, please.", "Yes, I do.", "No, I wouldn't.", "Yes, I like."], answer: 0, explain: "<b>✅ Giải thích:</b> Mẫu câu mời lịch sự 'Would you like...?' thường được đáp lại bằng 'Yes, please' (Đồng ý) hoặc 'No, thanks' (Từ chối).<br/><b>❌ Phân tích:</b> Không trả lời 'Yes, I do' vì đây không phải câu hỏi Do you...<br/><b>💡 Ví dụ:</b> <i>- Would you like some tea? - <b>No, thanks.</b></i>" },
  { id: 21, type: 'mcq', question: "Choose the CLOSEST meaning: The new laws will <b>ban</b> smoking in public places.", options: ["allow", "prohibit", "limit", "encourage"], answer: 1, explain: "<b>✅ Giải thích:</b> 'ban' = 'prohibit': cấm đoán, không cho phép.<br/><b>❌ Phân tích:</b> allow (cho phép) là trái nghĩa. limit (giới hạn), encourage (khuyến khích) sai nghĩa hoàn toàn.<br/><b>💡 Ví dụ:</b> <i>Using phones during the exam is <b>prohibited</b> (banned).</i>" },
  { id: 22, type: 'mcq', question: "Choose the CLOSEST meaning: He is a <b>well-known</b> author.", options: ["famous", "unknown", "boring", "rich"], answer: 0, explain: "<b>✅ Giải thích:</b> 'well-known' = 'famous': nổi tiếng, được nhiều người biết đến.<br/><b>❌ Phân tích:</b> unknown (vô danh) là trái nghĩa. rich (giàu) không mang nghĩa tương đồng.<br/><b>💡 Ví dụ:</b> <i>Son Tung M-TP is a <b>famous</b> (well-known) singer.</i>" },
  { id: 23, type: 'mcq', question: "Choose the OPPOSITE meaning: She felt <b>confident</b> before the interview.", options: ["nervous", "sure", "proud", "happy"], answer: 0, explain: "<b>✅ Giải thích:</b> Từ TRÁI NGHĨA với 'confident' (tự tin) là 'nervous' (lo lắng, hồi hộp).<br/><b>❌ Phân tích:</b> sure (chắc chắn) là từ đồng nghĩa. proud (tự hào) sai ngữ cảnh.<br/><b>💡 Ví dụ:</b> <i>Don't be <b>nervous</b>, you will do great!</i>" },
  { id: 24, type: 'mcq', question: "Choose the OPPOSITE meaning: We need to <b>protect</b> the environment.", options: ["save", "destroy", "clean", "keep"], answer: 1, explain: "<b>✅ Giải thích:</b> Từ TRÁI NGHĨA với 'protect' (bảo vệ) là 'destroy' (phá hủy).<br/><b>❌ Phân tích:</b> save (cứu/bảo vệ) là đồng nghĩa. clean (làm sạch) không phải nghĩa đối lập.<br/><b>💡 Ví dụ:</b> <i>Pollution will <b>destroy</b> our planet.</i>" },
  { id: 25, type: 'mcq', question: "Find the mistake: <u>Because of</u> (A) the weather <u>was</u> (B) bad, we <u>stayed</u> (C) <u>at home</u> (D).", options: ["A", "B", "C", "D"], answer: 0, explain: "<b>✅ Giải thích:</b> 'the weather was bad' là một mệnh đề hoàn chỉnh (S + V) nên bắt buộc phải dùng 'Because'.<br/><b>❌ Phân tích:</b> 'Because of' chỉ được cộng với Noun/V-ing (Because of the bad weather).<br/><b>💡 Ví dụ:</b> <i><b>Because</b> it rained, we didn't go out.</i>" },
  { id: 26, type: 'mcq', question: "Find the mistake: He <u>enjoys</u> (A) <u>to listen</u> (B) <u>to</u> (C) music <u>in</u> (D) his free time.", options: ["A", "B", "C", "D"], answer: 1, explain: "<b>✅ Giải thích:</b> Quy tắc: Sau động từ 'enjoy' phải là danh động từ V-ing. Sửa 'to listen' thành 'listening'.<br/><b>❌ Phân tích:</b> Các giới từ 'to music' và 'in his free time' đã sử dụng chính xác.<br/><b>💡 Ví dụ:</b> <i>I enjoy <b>reading</b> books at night.</i>" },
  { id: 27, type: 'mcq', question: "Find the mistake: <u>The</u> (A) boy <u>who</u> (B) bike was <u>stolen</u> (C) is <u>crying</u> (D).", options: ["A", "B", "C", "D"], answer: 1, explain: "<b>✅ Giải thích:</b> Cần đại từ quan hệ chỉ sự sở hữu 'chiếc xe đạp CỦA cậu bé' -> Sửa 'who' thành 'whose'.<br/><b>❌ Phân tích:</b> 'who' làm chủ ngữ thay cho người, không thể đi trực tiếp với danh từ 'bike' theo cấu trúc này.<br/><b>💡 Ví dụ:</b> <i>The man <b>whose</b> car is blue is my uncle.</i>" },
  { id: 28, passageRef: "cloze1", type: 'mcq', question: "Choose the correct word for blank (28):", options: ["in", "on", "at", "of"], answer: 0, explain: "<b>✅ Giải thích:</b> Cụm từ cố định 'increase in something': sự gia tăng về số lượng của cái gì đó (dân số).<br/><b>❌ Phân tích:</b> Không dùng increase on/at/of trong trường hợp biểu thị sự gia tăng nội tại.<br/><b>💡 Ví dụ:</b> <i>There is a huge <b>increase in</b> global temperature.</i>" },
  { id: 29, passageRef: "cloze1", type: 'mcq', question: "Choose the correct word for blank (29):", options: ["to", "for", "on", "in"], answer: 2, explain: "<b>✅ Giải thích:</b> Cấu trúc 'have an influence/impact/effect ON something': có ảnh hưởng lên cái gì.<br/><b>❌ Phân tích:</b> Rất dễ chọn nhầm 'in' hay 'to' nếu dịch word-by-word từ tiếng Việt sang.<br/><b>💡 Ví dụ:</b> <i>Parents have a big <b>influence on</b> their children.</i>" },
  { id: 30, passageRef: "cloze1", type: 'mcq', question: "Choose the correct word for blank (30):", options: ["up", "down", "out", "off"], answer: 1, explain: "<b>✅ Giải thích:</b> Phrasal verb 'knock down' mang nghĩa là phá dỡ, đánh sập (các tòa nhà/kiến trúc).<br/><b>❌ Phân tích:</b> knock out (đánh gục trong thể thao), knock off (ngừng làm việc) sai ngữ cảnh.<br/><b>💡 Ví dụ:</b> <i>The old factory was <b>knocked down</b> to build a mall.</i>" },
  { id: 31, passageRef: "cloze1", type: 'mcq', question: "Choose the correct word for blank (31):", options: ["more", "most", "much", "many"], answer: 0, explain: "<b>✅ Giải thích:</b> Dùng 'more' để bổ nghĩa cho tính từ dài 'difficult' tạo thành so sánh hơn (khó khăn hơn).<br/><b>❌ Phân tích:</b> most (nhất), much/many không ghép được trực tiếp với tính từ ở dạng này.<br/><b>💡 Ví dụ:</b> <i>This test is <b>more</b> difficult than the last one.</i>" },
  { id: 32, passageRef: "cloze1", type: 'mcq', question: "Choose the correct word for blank (32):", options: ["plenty", "amount", "number", "deal"], answer: 0, explain: "<b>✅ Giải thích:</b> 'plenty of' + danh từ đếm được/không đếm được = rất nhiều. Phía sau có chữ 'of' nên chọn plenty.<br/><b>❌ Phân tích:</b> a large amount of (phải có a large), a number of (phải có a).<br/><b>💡 Ví dụ:</b> <i>Don't worry, we have <b>plenty of</b> time.</i>" },
  { id: 33, passageRef: "reading1", type: 'mcq', question: "According to the passage, what is the Internet mainly used for?", options: ["Playing sports", "Getting information and communicating", "Traveling", "Cooking"], answer: 1, explain: "<b>✅ Giải thích:</b> Trong đoạn 1 có viết rõ: 'very fast and convenient way to get information... communicate'.<br/><b>❌ Phân tích:</b> Bài đọc không hề đề cập đến thể thao, du lịch hay nấu ăn.<br/><b>💡 Mẹo:</b> <i>Luôn scan các từ khóa (information, communicate) từ câu hỏi vào thẳng bài đọc.</i>" },
  { id: 34, passageRef: "reading1", type: 'mcq', question: "What does the word 'It' in paragraph 1 refer to?", options: ["Information", "The Internet", "A village", "E-mail"], answer: 1, explain: "<b>✅ Giải thích:</b> Từ 'It' thay thế cho chủ ngữ chính được nhắc đến liên tục ở câu trước đó chính là 'The Internet'.<br/><b>❌ Phân tích:</b> Các danh từ khác đóng vai trò tân ngữ phụ, không phải chủ thể tạo ra hành động 'makes our world...'<br/><b>💡 Ví dụ:</b> <i>I bought a <b>book</b>. <b>It</b> is very heavy.</i>" },
  { id: 35, passageRef: "reading1", type: 'mcq', question: "Which of the following is NOT mentioned as a limitation of the Internet?", options: ["It is costly", "It is time-consuming", "It is dangerous due to viruses", "It causes health problems"], answer: 3, explain: "<b>✅ Giải thích:</b> Trong bài liệt kê: time-consuming, costly, dangerous (viruses). KHÔNG đề cập đến health problems (vấn đề sức khỏe).<br/><b>❌ Phân tích:</b> Dạng câu hỏi 'NOT mentioned' yêu cầu loại trừ các ý đã có mặt trong bài.<br/><b>💡 Mẹo:</b> <i>Đọc kỹ đoạn 2 (đoạn về limitations) để đối chiếu và loại trừ từng đáp án.</i>" },
  { id: 36, passageRef: "reading1", type: 'mcq', question: "What does 'electronic junk mail' mean?", options: ["Spam", "Useful information", "Good programs", "Letters from relatives"], answer: 0, explain: "<b>✅ Giải thích:</b> 'junk mail' đồng nghĩa với thư rác (Spam). Ngay trong bài cũng viết 'risks such as spam OR electronic junk mail'.<br/><b>❌ Phân tích:</b> useful info, good programs là lợi ích, trái ngược với ngữ cảnh rủi ro (risks).<br/><b>💡 Ví dụ:</b> <i>I receive a lot of <b>spam</b> in my email every day.</i>" },
  { id: 37, passageRef: "reading1", type: 'mcq', question: "What is the author's advice at the end?", options: ["Stop using the Internet", "Be careful while surfing", "Buy anti-virus software", "Only use e-mail"], answer: 1, explain: "<b>✅ Giải thích:</b> Câu cuối cùng tác giả khuyên 'be alert!' (hãy cảnh giác/cẩn thận). Tương đương 'Be careful'.<br/><b>❌ Phân tích:</b> Tác giả không bảo dừng sử dụng hay mua phần mềm, chỉ cảnh báo ý thức người dùng.<br/><b>💡 Ví dụ:</b> <i>You must <b>be alert</b> to the dangers of the street.</i>" },
  { id: 38, passageRef: "reading2", type: 'mcq', question: "What is the main topic of the passage?", options: ["Fossil fuels", "Renewable energy", "How to install solar panels", "Climate change in the future"], answer: 1, explain: "<b>✅ Giải thích:</b> Ngay câu đầu tiên đã nêu chủ đề: 'Renewable energy sources... are becoming increasingly important'. Toàn bài bổ sung ý này.<br/><b>❌ Phân tích:</b> Nhiên liệu hóa thạch hay biến đổi khí hậu chỉ là các chi tiết phụ để làm nổi bật sự quan trọng của năng lượng tái tạo.<br/><b>💡 Mẹo:</b> <i>Câu chủ đề (Main Idea) thường nằm ở câu đầu tiên hoặc câu cuối của đoạn văn đầu.</i>" },
  { id: 39, passageRef: "reading2", type: 'mcq', question: "According to the passage, fossil fuels will _____.", options: ["become cheaper", "last forever", "eventually run out", "stop polluting"], answer: 2, explain: "<b>✅ Giải thích:</b> Bài đọc ghi rõ: 'fossil fuels, which will eventually run out' (nhiên liệu hóa thạch, thứ mà cuối cùng sẽ cạn kiệt).<br/><b>❌ Phân tích:</b> Các đáp án 'last forever' (tồn tại mãi) là sai hoàn toàn với cả sự thật và dữ kiện trong bài.<br/><b>💡 Ví dụ:</b> <i>Coal and oil are fossil fuels that will <b>run out</b> soon.</i>" },
  { id: 40, passageRef: "reading2", type: 'mcq', question: "How do solar panels work?", options: ["They use wind power", "They capture sunlight", "They burn coal", "They use water flow"], answer: 1, explain: "<b>✅ Giải thích:</b> Bài đọc ghi: 'Solar panels capture sunlight to generate electricity'.<br/><b>❌ Phân tích:</b> Dùng sức gió (wind power) là của wind turbines, không phải của solar panels (tấm pin năng lượng mặt trời).<br/><b>💡 Ví dụ:</b> <i>Plants also <b>capture sunlight</b> to make food.</i>" },
  { id: 41, passageRef: "reading2", type: 'mcq', question: "What is a disadvantage of renewable energy systems mentioned in the text?", options: ["They are bad for the environment", "They don't work in winter", "The initial cost can be high", "They are too loud"], answer: 2, explain: "<b>✅ Giải thích:</b> Nhược điểm duy nhất được nhắc đến là: 'the initial cost of installing these systems can be high' (chi phí lắp đặt ban đầu cao).<br/><b>❌ Phân tích:</b> Bài không hề đề cập đến việc chúng ồn ào hay không hoạt động vào mùa đông.<br/><b>💡 Ví dụ:</b> <i>Electric cars are great, but their <b>initial cost is high</b>.</i>" },
  { id: 42, passageRef: "reading2", type: 'mcq', question: "Why are countries investing in green technology?", options: ["To reduce carbon emissions", "To make more fossil fuels", "To increase temperatures", "To build more cities"], answer: 0, explain: "<b>✅ Giải thích:</b> Câu cuối ghi rõ mục đích đầu tư là 'to reduce carbon emissions and combat climate change' (giảm khí thải carbon và chống biến đổi khí hậu).<br/><b>❌ Phân tích:</b> Không một quốc gia nào lại đi đầu tư công nghệ xanh để 'tăng nhiệt độ' hay 'tạo thêm nhiên liệu hóa thạch'.<br/><b>💡 Ví dụ:</b> <i>Riding bicycles helps <b>reduce carbon emissions</b>.</i>" },
  { id: 43, type: 'fill', question: "Type the missing part: 'They built this house in 2020.' -> This house [________________] in 2020.", answer: "was built", explain: "<b>✅ Giải thích:</b> Chuyển từ chủ động sang bị động ở thì Quá khứ đơn: S + was/were + V3/ed.<br/><b>❌ Phân tích:</b> Chủ ngữ mới 'house' là số ít nên dùng 'was'. Động từ build đổi thành V3 là 'built'.<br/><b>💡 Ví dụ:</b> <i>Someone stole my bike -> My bike <b>was stolen</b>.</i>" },
  { id: 44, type: 'fill', question: "Type the missing part: 'It’s a pity I don’t have a car.' -> I wish I [________________] a car.", answer: "had", explain: "<b>✅ Giải thích:</b> Câu điều ước trái với hiện tại (I don't have) -> Động từ lùi về Quá khứ đơn (had).<br/><b>❌ Phân tích:</b> Không giữ nguyên 'have' hoặc dùng 'have had' trong trường hợp câu wish ở hiện tại.<br/><b>💡 Ví dụ:</b> <i>I don't know the answer -> I wish I <b>knew</b> the answer.</i>" },
  { id: 45, type: 'fill', question: "Type the missing part: '\"I am doing my homework now,\" he said.' -> He said that he [________________] his homework then.", answer: "was doing", explain: "<b>✅ Giải thích:</b> Câu tường thuật (gián tiếp) phải lùi thì: Hiện tại tiếp diễn (am doing) -> Quá khứ tiếp diễn (was doing).<br/><b>❌ Phân tích:</b> Chủ ngữ 'he' đi với 'was'. Không được giữ nguyên 'am doing' vì động từ tường thuật 'said' ở quá khứ.<br/><b>💡 Ví dụ:</b> <i>\"I am reading\" she said -> She said she <b>was reading</b>.</i>" },
  { id: 46, type: 'fill', question: "Type the missing part: 'Despite the bad weather, they went out.' -> Although the weather [________________], they went out.", answer: "was bad", explain: "<b>✅ Giải thích:</b> Despite + Cụm danh từ (the bad weather) chuyển thành Although + Mệnh đề (S + V). S='the weather', V='was bad'.<br/><b>❌ Phân tích:</b> Phải dùng thì Quá khứ 'was' để đồng thì với vế sau 'went out'.<br/><b>💡 Ví dụ:</b> <i>Despite his illness -> Although he <b>was ill</b>.</i>" },
  { id: 47, type: 'word_order', question: "Arrange the words to make a meaningful sentence:", shuffled: ["interested", "He", "history", "is", "in", "learning", "very", "local", "."], answer: "He is very interested in learning local history .", explain: "<b>✅ Giải thích:</b> Áp dụng cấu trúc: S + to be + (very) interested in + V-ing / Noun (rất quan tâm đến việc gì).<br/><b>❌ Phân tích:</b> Các từ được sắp xếp tạo thành 'anh ấy rất quan tâm đến việc học lịch sử địa phương'.<br/><b>💡 Ví dụ:</b> <i>She is <b>interested in</b> reading books.</i>" },
  { id: 48, type: 'word_order', question: "Arrange the words to make a meaningful sentence:", shuffled: ["have", "I", "not", "since", "seen", "2018", "him", "."], answer: "I have not seen him since 2018 .", explain: "<b>✅ Giải thích:</b> Cấu trúc thì Hiện tại hoàn thành dạng phủ định: S + have/has + not + V3 + since + Mốc thời gian.<br/><b>❌ Phân tích:</b> Không xếp 'since' ra đầu câu trong ngữ cảnh giao tiếp thông thường này.<br/><b>💡 Ví dụ:</b> <i>We <b>have not met</b> her since Monday.</i>" },
  { id: 49, type: 'word_order', question: "Arrange the words to make a meaningful sentence:", shuffled: ["book", "reading", "the", "The", "boy", "is", "my", "is", "brother", "."], answer: "The boy reading the book is my brother .", explain: "<b>✅ Giải thích:</b> Câu sử dụng Rút gọn mệnh đề quan hệ dạng chủ động (V-ing): The boy (who is) reading the book...<br/><b>❌ Phân tích:</b> Dịch nghĩa: 'Cậu bé (người đang) đọc sách là anh trai tôi.' Phải xác định đúng động từ chính là 'is my brother'.<br/><b>💡 Ví dụ:</b> <i>The girl <b>standing</b> there is my sister.</i>" },
  { id: 50, type: 'word_order', question: "Arrange the words to make a meaningful sentence:", shuffled: ["important", "It", "to", "is", "English", "every", "practice", "day", "."], answer: "It is important to practice English every day .", explain: "<b>✅ Giải thích:</b> Cấu trúc chủ ngữ giả: It is + adjective (important) + to V (to practice) + Object (English) + Time (every day).<br/><b>❌ Phân tích:</b> Không thể xếp 'English' lên làm chủ ngữ nếu có cụm 'It is important'.<br/><b>💡 Ví dụ:</b> <i><b>It is necessary to</b> drink enough water.</i>" }
];

const defaultExam = {
  id: 'default-exam-1',
  name: 'luyện đề đi các tình iu - Tiêu Chuẩn (50 Câu)',
  color: 'from-cyan-500 to-indigo-600',
  createdAt: new Date().toISOString(),
  quizData: defaultQuizData,
  passages: defaultPassages,
  isFull: true
};

// ==========================================
// STYLES & EFFECTS (OPTIMIZED)
// ==========================================
const styleTag = `
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&display=swap');

body { 
  font-family: 'Lexend', sans-serif; 
  background: #050515; 
  color: #f8fafc;
  overflow-x: hidden; 
  scroll-behavior: smooth;
}

.bg-galaxy {
  background: radial-gradient(ellipse at 20% 30%, rgba(34, 40, 92, 0.8) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(11, 29, 56, 0.6) 0%, transparent 50%),
              #050515;
}

.breathe-glow { animation: breathe 8s ease-in-out infinite alternate; }
@keyframes breathe {
  0% { transform: scale(1); opacity: 0.2; filter: blur(50px); }
  100% { transform: scale(1.05); opacity: 0.4; filter: blur(60px); }
}

.glass { 
  background: rgba(15, 23, 42, 0.4); 
  backdrop-filter: blur(20px); 
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08); 
  box-shadow: 0 4px 15px 0 rgba(0, 0, 0, 0.2);
}

.glass-panel {
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
  backdrop-filter: blur(24px);
  border-top: 1px solid rgba(255,255,255,0.1);
  border-left: 1px solid rgba(255,255,255,0.1);
}

.mirror-glow { position: relative; overflow: hidden; }
.mirror-glow::before {
  content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
  transform: skewX(-20deg); transition: 0.4s;
}
.mirror-glow:hover::before { left: 200%; transition: 0.6s ease-in-out; }

.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }

.shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake {
  10%, 90% { transform: translate3d(-2px, 0, 0); }
  20%, 80% { transform: translate3d(4px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
  40%, 60% { transform: translate3d(6px, 0, 0); }
}

@keyframes cosmic-pop {
  0% { transform: scale(0.3) translateY(40px) rotate(-10deg); opacity: 0; filter: blur(10px); }
  40% { transform: scale(1.1) translateY(-10px) rotate(3deg); opacity: 1; filter: blur(0px); }
  70% { transform: scale(1) translateY(0) rotate(0deg); opacity: 1; filter: brightness(1.2); }
  100% { transform: scale(1.2) translateY(-20px) rotate(5deg); opacity: 0; filter: blur(5px); }
}
@keyframes particle-burst-pro {
  0% { transform: translate(0, 0) scale(0); opacity: 1; }
  20% { transform: translate(calc(var(--tx) * 0.2), calc(var(--ty) * 0.2)) scale(1.5); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}
@keyframes cosmic-shine { to { background-position: 200% center; } }
@keyframes ring-expand-pro {
  0% { transform: scale(0); opacity: 0; border-width: 20px; box-shadow: inset 0 0 0 rgba(255,255,255,0); }
  20% { opacity: 1; border-width: 15px; box-shadow: inset 0 0 30px rgba(232, 121, 249, 0.6); }
  100% { transform: scale(2); opacity: 0; border-width: 0px; box-shadow: inset 0 0 0 rgba(232, 121, 249, 0); }
}

.compliment-container { animation: cosmic-pop 1.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
.compliment-text-v2 {
  background: linear-gradient(to right, #a5f3fc, #d8b4fe, #f472b6, #22d3ee, #a5f3fc);
  background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text;
  animation: cosmic-shine 2s linear infinite; text-shadow: 0 0 15px rgba(255,255,255,0.1);
}
.nova-ring-2 {
  position: absolute; inset: -60px; border-radius: 50%;
  border: 20px solid rgba(232, 121, 249, 0.5);
  animation: ring-expand-pro 1.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
  pointer-events: none;
}

.dangerously-html u { text-decoration-color: #22d3ee; text-underline-offset: 4px; }
.dangerously-html b { color: #818cf8; }
.dangerously-html i { color: #f472b6; }
`;

// ==========================================
// BACKGROUND COMPONENTS (MEMOIZED)
// ==========================================
const GalaxyBackground = React.memo(() => {
  const [stars] = useState(() =>
    Array.from({ length: 100 }).map((_, i) => ({
      id: i, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 0.5}px`, delay: `${Math.random() * 5}s`, dur: `${Math.random() * 4 + 2}s`,
      color: Math.random() > 0.8 ? '#a5f3fc' : Math.random() > 0.6 ? '#d8b4fe' : '#ffffff'
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-0 bg-galaxy overflow-hidden">
      {stars.map((s) => (
        <div key={s.id} className="absolute rounded-full shadow-[0_0_8px_currentColor] animate-[twinkle_infinite_alternate]"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.dur, backgroundColor: s.color, color: s.color }}
        />
      ))}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full breathe-glow mix-blend-screen"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full breathe-glow mix-blend-screen" style={{ animationDelay: '-4s' }}></div>
    </div>
  );
});

const GalaxyCompliment = React.memo(({ text }) => {
  const [particles] = useState(() => Array.from({ length: 30 }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 250;
    const size = 3 + Math.random() * 10;
    const colors = ['#22d3ee', '#818cf8', '#c084fc', '#f472b6', '#fcd34d', '#ffffff'];
    return {
      id: i, color: colors[Math.floor(Math.random() * colors.length)], size: `${size}px`,
      tx: `${Math.cos(angle) * distance}px`, ty: `${Math.sin(angle) * distance}px`, delay: `${Math.random() * 0.2}s`
    };
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden bg-black/40 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative flex items-center justify-center compliment-container z-10">
        <div className="nova-ring-2"></div>
        {particles.map(p => (
          <div key={p.id} className="absolute rounded-full z-0 shadow-md"
            style={{ width: p.size, height: p.size, backgroundColor: p.color, boxShadow: `0 0 15px ${p.color}`, animation: `particle-burst-pro 1.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`, animationDelay: p.delay, '--tx': p.tx, '--ty': p.ty }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 blur-[100px] -z-10 rounded-full scale-[2] opacity-0 animate-[fade-in-out_1.5s_ease-in-out_forwards]"></div>
        <div className="compliment-wrapper relative z-20 mix-blend-screen">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black compliment-text-v2 text-center px-6 py-4 leading-tight tracking-tighter uppercase">{text}</h1>
        </div>
      </div>
    </div>
  );
});

// ==========================================
// MEMOIZED OPTION ITEM (PERFORMANCE BOOST)
// ==========================================
const MemoizedOptionItem = React.memo(({ opt, idx, isSelected, isCorrect, isRevealed, isSubmitted, onSelect, onSpeak, textSizeScale }) => {
  let btnCls = "w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group relative overflow-hidden ";

  if (isRevealed || isSubmitted) {
    if (isCorrect) btnCls += "bg-emerald-500/10 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.15)] text-emerald-50 ";
    else if (isSelected) btnCls += "bg-rose-500/10 border-rose-500/60 text-rose-50 ";
    else btnCls += "bg-black/20 border-white/5 opacity-50 ";
  } else {
    btnCls += isSelected
      ? "bg-indigo-600/80 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)] text-white scale-[1.02] "
      : "bg-black/40 border-white/10 hover:border-indigo-400 hover:bg-white/5 text-slate-300 mirror-glow ";
  }

  return (
    <button onClick={() => onSelect(idx)} disabled={isRevealed || isSubmitted} className={btnCls}>
      <div className="flex items-center gap-3 relative z-10 w-full pr-16">
        <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-black text-sm transition-all duration-200 ${isSelected && !isRevealed ? 'bg-cyan-400 text-slate-900 shadow-md' :
          isRevealed && isCorrect ? 'bg-emerald-500 text-white' :
            isRevealed && isSelected && !isCorrect ? 'bg-rose-500 text-white' :
              'bg-white/10 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white'
          }`}>
          {['A', 'B', 'C', 'D'][idx]}
        </span>
        <span className="font-semibold dangerously-html leading-tight" style={{ fontSize: `${16 * textSizeScale}px` }} dangerouslySetInnerHTML={{ __html: opt }}></span>
      </div>

      <div className="absolute right-10 z-20">
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSpeak(opt); }} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-white/10 rounded-lg transition-all duration-200" title="Nghe đáp án này">
          <Volume2 className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-center gap-2 relative z-10 absolute right-4">
        {isRevealed && isCorrect && <CheckCircle className="text-emerald-400 w-5 h-5 animate-in zoom-in duration-300 shrink-0" />}
        {isRevealed && isSelected && !isCorrect && <AlertCircle className="text-rose-400 w-5 h-5 animate-in zoom-in duration-300 shrink-0" />}
      </div>
    </button>
  );
});

// ==========================================
// EXAM PLAYER COMPONENT (CORE)
// ==========================================
const ExamPlayer = ({ exam, onExit, onComplete }) => {
  const { quizData, passages } = exam;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [revealedQuestions, setRevealedQuestions] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60 * 60);
  const [showGrid, setShowGrid] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [textSizeScale, setTextSizeScale] = useState(1);
  const [compliment, setCompliment] = useState(null);
  const [bookmarked, setBookmarked] = useState(new Set());

  // Audio State
  const synth = window.speechSynthesis;
  const [isPlaying, setIsPlaying] = useState(false);
  const touchStartX = useRef(null);

  const showTrendyCompliment = useCallback(() => {
    const praises = ["10đ không có nhưng", "vcl đúng ", "trình là giè!", "adu", "out meta luông", "oi thoi chec đúng r", "yêu thế nhì"];
    setCompliment(praises[Math.floor(Math.random() * praises.length)]);
    setTimeout(() => setCompliment(null), 1800);
  }, []);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  }, []);

  // Audio Logic
  const speakAI = useCallback((text) => {
    if (!text) return;
    synth.cancel();
    const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/_+/g, 'blank').replace(/\[___\]/g, 'blank');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = synth.getVoices();
    const premiumVoice = voices.find(v => v.name.includes("Google US English")) || voices.find(v => v.lang.startsWith("en-US")) || voices.find(v => v.lang.startsWith("en"));
    if (premiumVoice) utterance.voice = premiumVoice;
    utterance.rate = 1; utterance.pitch = 1.05;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    synth.speak(utterance);
  }, [synth]);

  useEffect(() => { return () => synth.cancel(); }, [synth]);

  // Submit Logic
  const processSubmit = useCallback(() => {
    let s = 0;
    quizData.forEach(q => {
      const u = userAnswers[q.id];
      if (q.type === 'mcq' && u === q.answer) s++;
      else if (q.type === 'fill' && String(u || '').toLowerCase().trim() === q.answer.toLowerCase().trim()) s++;
      else if (q.type === 'word_order' && (u || []).map(idx => q.shuffled[idx]).join(" ") === q.answer) s++;
    });
    setScore(s);
    setIsSubmitted(true);
    setShowGrid(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onComplete) onComplete(s, quizData.length, userAnswers);
  }, [quizData, userAnswers, onComplete]);

  const handleManualSubmit = useCallback(() => {
    if (isSubmitted) return;
    if (window.confirm("cưng có chắc chắn muốn nộp bài sớm không? Các câu chưa làm sẽ được tính là sai.")) {
      processSubmit();
    }
  }, [isSubmitted, processSubmit]);

  // Timer Effect
  useEffect(() => {
    let timer;
    if (!isSubmitted && timeRemaining > 0) {
      timer = setInterval(() => setTimeRemaining(p => p - 1), 1000);
    } else if (timeRemaining === 0 && !isSubmitted) {
      processSubmit();
    }
    return () => clearInterval(timer);
  }, [isSubmitted, timeRemaining, processSubmit]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => prev < quizData.length - 1 ? prev + 1 : prev);
  }, [quizData.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : prev);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (isSubmitted) return;
      const key = e.key.toLowerCase();
      const currentQ = quizData[currentIndex];
      if (e.code === 'Space') { e.preventDefault(); handleNext(); return; }
      if (e.key === 'Shift') { e.preventDefault(); handlePrev(); return; }
      if (currentQ.type === 'mcq') {
        const map = { 'z': 0, 'a': 0, '1': 0, 'x': 1, 'b': 1, '2': 1, 'c': 2, '3': 2, 'v': 3, 'd': 3, '4': 3 };
        if (map[key] !== undefined) handleSelectMCQ(currentQ.id, map[key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isSubmitted, quizData, handleNext, handlePrev]);

  // Swipe Mobile logic
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) { if (diff > 0) handleNext(); else handlePrev(); }
    touchStartX.current = null;
  };

  const handleSelectMCQ = useCallback((qId, optIdx) => {
    if (isSubmitted || revealedQuestions[qId]) return;
    setUserAnswers(prev => ({ ...prev, [qId]: optIdx }));
    setRevealedQuestions(prev => ({ ...prev, [qId]: true }));
    const isCorrect = quizData.find(q => q.id === qId).answer === optIdx;
    if (isCorrect) showTrendyCompliment(); else triggerShake();
  }, [isSubmitted, revealedQuestions, quizData, showTrendyCompliment, triggerShake]);

  const handleFill = useCallback((qId, val) => {
    if (!isSubmitted) setUserAnswers(prev => ({ ...prev, [qId]: val }));
  }, [isSubmitted]);

  const checkFill = useCallback((qId) => {
    if (revealedQuestions[qId] || isSubmitted) return;
    setRevealedQuestions(prev => ({ ...prev, [qId]: true }));
    const q = quizData.find(q => q.id === qId);
    const isCorrect = (userAnswers[qId] || "").toLowerCase().trim() === q.answer.toLowerCase().trim();
    if (isCorrect) showTrendyCompliment(); else triggerShake();
  }, [isSubmitted, revealedQuestions, quizData, userAnswers, showTrendyCompliment, triggerShake]);

  const handleWordOrderClick = useCallback((qId, wordIdx, isSelected) => {
    if (isSubmitted || revealedQuestions[qId]) return;
    setUserAnswers(prev => {
      const currentAns = prev[qId] || [];
      return isSelected ? { ...prev, [qId]: currentAns.filter(i => i !== wordIdx) } : { ...prev, [qId]: [...currentAns, wordIdx] };
    });
  }, [isSubmitted, revealedQuestions]);

  const checkWordOrder = useCallback((qId) => {
    if (revealedQuestions[qId] || isSubmitted) return;
    setRevealedQuestions(prev => ({ ...prev, [qId]: true }));
    const q = quizData.find(q => q.id === qId);
    const userAnswerStr = (userAnswers[qId] || []).map(idx => q.shuffled[idx]).join(" ");
    if (userAnswerStr === q.answer) showTrendyCompliment(); else triggerShake();
  }, [isSubmitted, revealedQuestions, quizData, userAnswers, showTrendyCompliment, triggerShake]);

  const toggleBookmark = useCallback((qId) => {
    setBookmarked(prev => {
      const newSet = new Set(prev);
      if (newSet.has(qId)) newSet.delete(qId);
      else newSet.add(qId);
      return newSet;
    });
  }, []);

  const currentQ = quizData[currentIndex];
  if (!currentQ) return null;
  const isRevealed = revealedQuestions[currentQ.id];
  const userAns = userAnswers[currentQ.id];
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="min-h-screen flex flex-col relative font-sans" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {compliment && <GalaxyCompliment text={compliment} />}

      {/* HEADER PRO - TUYỆT ĐỐI CĂN GIỮA VÀ ĐỒNG NHẤT KHUNG */}
      <header className="fixed top-0 w-full glass z-50 border-b border-white/10 transition-all duration-300 flex justify-center">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onExit} className="p-2 glass hover:bg-white/10 rounded-xl transition-all duration-200"><ChevronLeft /></button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400 uppercase">
                {exam.name}
              </h1>
              <p className="text-xs text-indigo-300 font-medium tracking-widest">PRO MAX EXAM ENGINE</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center glass rounded-xl border border-white/10 overflow-hidden">
              <button onClick={() => setTextSizeScale(s => Math.max(0.8, s - 0.1))} className="p-2 hover:bg-white/10 text-slate-300 transition-colors duration-200"><ZoomOut className="w-4 h-4" /></button>
              <div className="px-2 font-bold text-cyan-400 text-xs flex items-center gap-1 w-12 justify-center">{Math.round(textSizeScale * 100)}%</div>
              <button onClick={() => setTextSizeScale(s => Math.min(1.5, s + 0.1))} className="p-2 hover:bg-white/10 text-slate-300 transition-colors duration-200"><ZoomIn className="w-4 h-4" /></button>
            </div>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl glass font-mono font-black border transition-all duration-300 ${timeRemaining < 300 ? 'text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse' : 'text-cyan-400 border-cyan-500/20'}`}>
              <Clock className="w-4 h-4" />
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>

            <button onClick={() => setShowGrid(!showGrid)} className="p-2 glass hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/10 text-indigo-300 relative">
              <Grip className="w-5 h-5" />
              {answeredCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#050515]"></span>}
            </button>
          </div>
        </div>

        {/* Progress bar bám sát đáy của Header */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
          <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-300 shadow-[0_0_10px_#06b6d4]"
            style={{ width: `${((currentIndex + 1) / quizData.length) * 100}%` }} />
        </div>
      </header>

      {/* SIDEBAR GRID PRO */}
      <aside className={`fixed top-0 right-0 h-full w-80 glass-panel z-[60] transform transition-transform duration-300 shadow-2xl flex flex-col ${showGrid ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/20">
          <h2 className="font-black flex items-center gap-2 uppercase tracking-wider text-cyan-300 text-sm"><Layers className="w-4 h-4" /> Bảng Câu Hỏi</h2>
          <button onClick={() => setShowGrid(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors duration-200"><XCircle className="w-5 h-5" /></button>
        </div>
        <div className="p-5 grid grid-cols-5 gap-2.5 overflow-y-auto flex-1 custom-scrollbar">
          {quizData.map((q, i) => {
            const isAns = revealedQuestions[q.id];
            const isBkmrk = bookmarked.has(q.id);
            let cls = "relative aspect-square rounded-xl font-extrabold text-sm flex items-center justify-center border-2 transition-all duration-200 mirror-glow ";

            if (i === currentIndex) cls += "bg-indigo-600 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.5)] scale-110 z-10 ";
            else if (isAns) {
              let correct = false;
              if (q.type === 'mcq') correct = userAnswers[q.id] === q.answer;
              else if (q.type === 'fill') correct = String(userAnswers[q.id]).toLowerCase().trim() === q.answer.toLowerCase().trim();
              else if (q.type === 'word_order') correct = (userAnswers[q.id] || []).map(idx => q.shuffled[idx]).join(" ") === q.answer;
              cls += correct ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-rose-500/20 border-rose-500/50 text-rose-400";
            } else cls += "bg-white/5 border-white/10 text-slate-400 hover:border-white/30";
            return (
              <button key={q.id} onClick={() => setCurrentIndex(i)} className={cls}>
                {i + 1}
                {isBkmrk && <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_5px_#facc15]"></div>}
              </button>
            );
          })}
        </div>
        <div className="p-5 bg-black/40 border-t border-white/10">
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-4 px-2">
            <div className="flex flex-col gap-1">
              <span className="text-cyan-400">Đã làm: {answeredCount}/{quizData.length}</span>
              <span className="text-slate-500">Chưa làm: {quizData.length - answeredCount}</span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-yellow-400">Đánh dấu: {bookmarked.size}</span>
            </div>
          </div>
          <button onClick={handleManualSubmit} disabled={isSubmitted} className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl font-black text-white shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all duration-200 uppercase tracking-widest text-sm flex items-center justify-center gap-2">
            {isSubmitted ? <><CheckCircle className="w-5 h-5" /> Đã Nộp Bài</> : "Nộp Bài Sớm"}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT PRO - LAYOUT PC ĐƯỢC FIX CÂN BẰNG TUYỆT ĐỐI */}
      <main className={`flex-1 pt-24 md:pt-28 pb-32 w-full relative z-10 transition-transform duration-200 ${isShaking ? 'shake' : ''}`}>

        <div className="w-full flex justify-center">
          <div className="w-full max-w-6xl mx-auto px-4 md:px-8">

            {/* THÔNG BÁO KẾT QUẢ ĐIỂM */}
            {isSubmitted && (
              <div className="w-full flex justify-center mb-8">
                <div className="w-full max-w-4xl p-8 glass rounded-[2rem] border-2 border-indigo-500/50 text-center shadow-[0_0_30px_rgba(79,70,229,0.25)] animate-in slide-in-from-top duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent"></div>
                  <Award className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce relative z-10 filter drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                  <h2 className="text-5xl font-black mb-2 text-white relative z-10">Điểm: <span className="text-cyan-400">{score}</span><span className="text-3xl text-slate-500">/{quizData.length}</span></h2>
                  <div className="flex justify-center gap-2 mb-2 relative z-10">
                    {score / quizData.length >= 0.8 ? <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-bold border border-emerald-500/50">Xuất Sắc</span> :
                      score / quizData.length >= 0.5 ? <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-bold border border-yellow-500/50">Khá Tốt</span> :
                        <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-sm font-bold border border-rose-500/50">Cần Cố Gắng Thêm</span>}
                  </div>
                </div>
              </div>
            )}

            {/* CĂN GIỮA VÀ CHIA CỘT THÔNG MINH */}
            {currentQ.passageRef ? (
              <div className="w-full flex flex-col lg:flex-row gap-6 transition-all duration-300">

                {/* PASSAGE PANEL */}
                <div className="w-full lg:flex-1 glass rounded-[2rem] p-6 border border-white/10 shadow-2xl flex flex-col h-[40vh] lg:h-[calc(100vh-220px)] lg:sticky top-28 overflow-hidden relative group transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                  <div className="flex items-center justify-between mb-4 shrink-0 relative z-10">
                    <div className="flex items-center gap-2 text-cyan-400 font-black text-xs tracking-[0.2em] uppercase">
                      <BookOpen className="w-4 h-4" /> Reading / Cloze Test
                    </div>
                    <button onClick={() => isPlaying ? synth.cancel() : speakAI(passages[currentQ.passageRef])} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold transition-all duration-200 shadow-md active:scale-95">
                      {isPlaying ? <PauseCircle className="w-4 h-4 text-rose-400" /> : <PlayCircle className="w-4 h-4" />}
                      {isPlaying ? "Dừng" : "Phát Audio"}
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 text-slate-200 leading-relaxed font-medium mt-2" style={{ fontSize: `${16 * textSizeScale}px` }}>
                    {passages[currentQ.passageRef].split('\n').map((para, i) => (
                      <p key={i} className="mb-4 text-justify dangerously-html" dangerouslySetInnerHTML={{ __html: para }}></p>
                    ))}
                  </div>
                </div>

                {/* QUESTION PANEL (RIGHT SIDE) */}
                <div className="w-full lg:flex-1 glass rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden border border-white/10 flex flex-col group transition-all duration-300">
                  <QuestionContent
                    currentQ={currentQ} currentIndex={currentIndex}
                    userAns={userAns} isRevealed={isRevealed} isSubmitted={isSubmitted} bookmarked={bookmarked}
                    textSizeScale={textSizeScale} handleSelectMCQ={handleSelectMCQ} handleFill={handleFill}
                    checkFill={checkFill} handleWordOrderClick={handleWordOrderClick} checkWordOrder={checkWordOrder}
                    toggleBookmark={toggleBookmark} speakAI={speakAI}
                  />
                </div>
              </div>
            ) : (
              <div className="w-full flex justify-center items-center">
                {/* QUESTION PANEL (CENTERED, MAX-W-4XL) */}
                <div className="w-full max-w-4xl glass rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden border border-white/10 flex flex-col group transition-all duration-300">
                  <QuestionContent
                    currentQ={currentQ} currentIndex={currentIndex}
                    userAns={userAns} isRevealed={isRevealed} isSubmitted={isSubmitted} bookmarked={bookmarked}
                    textSizeScale={textSizeScale} handleSelectMCQ={handleSelectMCQ} handleFill={handleFill}
                    checkFill={checkFill} handleWordOrderClick={handleWordOrderClick} checkWordOrder={checkWordOrder}
                    toggleBookmark={toggleBookmark} speakAI={speakAI}
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* STICKY BOTTOM BAR PRO - TUYỆT ĐỐI CĂN GIỮA */}
      <footer className="fixed bottom-0 w-full glass border-t border-white/10 z-50 transition-all duration-300 flex justify-center">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
          <button onClick={handlePrev} disabled={currentIndex === 0} className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 glass hover:bg-white/10 rounded-xl font-bold disabled:opacity-30 transition-all duration-200 active:scale-95 border border-white/10 group text-sm">
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Quay Lại</span>
          </button>

          <div className="flex-1 px-4 md:px-8 flex items-center justify-center">
            <div className="w-full max-w-md h-2 bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300" style={{ width: `${((currentIndex + 1) / quizData.length) * 100}%` }}></div>
            </div>
            <span className="ml-3 text-xs font-black text-slate-400 shrink-0 w-12">{currentIndex + 1}/{quizData.length}</span>
          </div>

          <button onClick={handleNext} className="flex items-center gap-1.5 md:gap-2 px-5 md:px-8 py-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-xl font-black text-white shadow-[0_4px_15px_rgba(6,182,212,0.3)] hover:brightness-110 transition-all duration-200 active:scale-95 group text-sm">
            <span className="hidden sm:inline">Tiếp Theo</span>
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </footer>
    </div>
  );
};

// ==========================================
// SEPARATED QUESTION CONTENT COMPONENT (MEMO)
// ==========================================
const QuestionContent = React.memo(({
  currentQ, currentIndex, userAns, isRevealed, isSubmitted, bookmarked,
  textSizeScale, handleSelectMCQ, handleFill, checkFill,
  handleWordOrderClick, checkWordOrder, toggleBookmark, speakAI
}) => {
  return (
    <>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2 w-[85%]">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-black tracking-widest uppercase border border-indigo-500/30 flex items-center gap-1">
              <Target className="w-3 h-3" /> Q.{currentIndex + 1}
            </span>
            {currentQ.type === 'mcq' && <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold uppercase border border-emerald-500/30">Multiple Choice</span>}
            {currentQ.type === 'fill' && <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-[10px] font-bold uppercase border border-pink-500/30">Fill in blank</span>}
          </div>

          <div className="flex items-start gap-3 mt-2">
            <h3 className="font-bold leading-relaxed text-white dangerously-html flex-1" style={{ fontSize: `${22 * textSizeScale}px` }} dangerouslySetInnerHTML={{ __html: currentQ.question }}></h3>
            <button onClick={() => speakAI(currentQ.question)} className="mt-1 p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/20 transition-all duration-200 hover:scale-110 active:scale-90 shadow-md shrink-0" title="Nghe câu hỏi">
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button onClick={() => toggleBookmark(currentQ.id)} className={`p-2.5 rounded-xl border transition-all duration-200 shadow-md ${bookmarked.has(currentQ.id) ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400' : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`} title="Đánh dấu câu này">
            {bookmarked.has(currentQ.id) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 1. TRẢ LỜI MCQ PRO */}
      {currentQ.type === 'mcq' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
          {currentQ.options.map((opt, idx) => (
            <MemoizedOptionItem
              key={`${currentQ.id}-${idx}`}
              opt={opt}
              idx={idx}
              isSelected={userAns === idx}
              isCorrect={currentQ.answer === idx}
              isRevealed={isRevealed}
              isSubmitted={isSubmitted}
              onSelect={() => handleSelectMCQ(currentQ.id, idx)}
              onSpeak={speakAI}
              textSizeScale={textSizeScale}
            />
          ))}
        </div>
      )}

      {/* 2. TRẢ LỜI FILL PRO */}
      {currentQ.type === 'fill' && (
        <div className="space-y-4 flex-1 mt-4">
          <div className="relative group">
            <input
              type="text" value={userAns || ''} onChange={(e) => handleFill(currentQ.id, e.target.value)} onKeyPress={(e) => e.key === 'Enter' && checkFill(currentQ.id)} disabled={isRevealed || isSubmitted} placeholder="Type your answer here..."
              className={`w-full bg-black/40 border-2 rounded-2xl p-5 pl-12 font-bold transition-all duration-300 outline-none focus:ring-4 focus:ring-cyan-500/10 ${isRevealed ? (String(userAns).toLowerCase().trim() === currentQ.answer.toLowerCase().trim() ? 'border-emerald-500/60 text-emerald-400' : 'border-rose-500/60 text-rose-400') : 'border-white/10 focus:border-cyan-400/50 text-cyan-300 placeholder:text-slate-600'
                }`}
              style={{ fontSize: `${18 * textSizeScale}px` }}
            />
            <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            {!isRevealed && !isSubmitted && (
              <button onClick={() => checkFill(currentQ.id)} className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white rounded-xl font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all duration-200">
                Check
              </button>
            )}
          </div>
          {isRevealed && String(userAns).toLowerCase().trim() !== currentQ.answer.toLowerCase().trim() && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-in slide-in-from-bottom duration-300 flex items-center gap-4">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-emerald-400/80 font-bold text-xs uppercase mb-0.5 tracking-wider">Correct Answer:</div>
                <div className="font-black text-emerald-300 text-lg">{currentQ.answer}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. WORD ORDER PRO */}
      {currentQ.type === 'word_order' && (
        <div className="space-y-6 flex-1 mt-2">
          <div className={`min-h-[80px] w-full bg-black/40 border-2 rounded-2xl p-5 transition-all duration-300 flex flex-wrap gap-2 items-start content-start ${isRevealed ? (((userAns || []).map(idx => currentQ.shuffled[idx]).join(" ") === currentQ.answer) ? 'border-emerald-500/60' : 'border-rose-500/60') : 'border-cyan-500/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]'
            }`}>
            {(userAns || []).length === 0 && !isRevealed && <span className="text-slate-600 text-sm font-medium mt-1">Tap words below to build the sentence...</span>}
            {(userAns || []).map((wordIdx, pos) => (
              <button key={`sel-${wordIdx}-${pos}`} onClick={() => handleWordOrderClick(currentQ.id, wordIdx, true)} disabled={isRevealed || isSubmitted}
                className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 shadow-sm active:scale-95 ${isRevealed ? (((userAns || []).map(idx => currentQ.shuffled[idx]).join(" ") === currentQ.answer) ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-rose-500/20 text-rose-300 border border-rose-500/50') : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 hover:border-cyan-400'
                  }`} style={{ fontSize: `${16 * textSizeScale}px` }}>{currentQ.shuffled[wordIdx]}</button>
            ))}
          </div>
          {!isRevealed && !isSubmitted && (
            <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
              {currentQ.shuffled.map((word, idx) => {
                if ((userAns || []).includes(idx)) return null;
                return (
                  <button key={`avail-${idx}`} onClick={() => handleWordOrderClick(currentQ.id, idx, false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-indigo-500 hover:text-white text-slate-300 rounded-lg font-medium transition-all duration-200 border border-white/10 shadow-sm active:scale-95"
                    style={{ fontSize: `${16 * textSizeScale}px` }}>{word}</button>
                );
              })}
            </div>
          )}
          {!isRevealed && !isSubmitted && (
            <div className="flex justify-end">
              <button onClick={() => checkWordOrder(currentQ.id)} disabled={(userAns || []).length !== currentQ.shuffled.length}
                className="px-6 py-2.5 bg-cyan-500 text-slate-900 rounded-xl font-bold shadow-md hover:brightness-110 active:scale-95 transition-all duration-200 disabled:opacity-50 text-sm">Check Sentence</button>
            </div>
          )}
          {isRevealed && ((userAns || []).map(idx => currentQ.shuffled[idx]).join(" ") !== currentQ.answer) && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-in slide-in-from-bottom duration-300 mt-4">
              <div className="text-emerald-400/80 font-bold text-[10px] uppercase mb-2 tracking-wider">Correct Sentence:</div>
              <div className="font-bold text-emerald-300" style={{ fontSize: `${16 * textSizeScale}px` }}>{currentQ.answer}</div>
            </div>
          )}
        </div>
      )}

      {/* GIẢI THÍCH CHI TIẾT TỰ ĐỘNG HIỂN THỊ (AUTO-SHOW) */}
      {(isRevealed || isSubmitted) && currentQ.explain && (
        <div className="mt-8 p-5 bg-black/30 border border-white/10 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400"></div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="text-cyan-400 w-4 h-4 animate-pulse" />
            <h4 className="font-bold text-cyan-400 text-xs uppercase tracking-wider">Giải thích chi tiết</h4>
          </div>
          <div className="text-slate-300 text-sm leading-relaxed border-t border-white/10 pt-3 space-y-2 dangerously-html" style={{ fontSize: `${15 * textSizeScale}px` }} dangerouslySetInnerHTML={{ __html: currentQ.explain }}>
          </div>
        </div>
      )}
    </>
  );
});

// ==========================================
// MAIN APP ENTRY
// ==========================================
export default function App() {
  const [currentExam] = useState(defaultExam);

  const saveResult = async (examId, score, total, answers) => {
    console.log(`Submitted: Score ${score}/${total}`);
  };

  return (
    <>
      <style>{styleTag}</style>
      <GalaxyBackground />
      <ExamPlayer
        exam={currentExam}
        onExit={() => alert("Chức năng thoát bị vô hiệu hóa trong chế độ thi trực tiếp.")}
        onComplete={(s, t, a) => saveResult(currentExam.id, s, t, a)}
      />
    </>
  );
}