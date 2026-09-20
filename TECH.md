# TECH - مرجع فنی پروژه آنجل

## 🌐 دامنه و سرور
- دامنه اصلی: `nomi98.com`
- زیردامنه API: `api.nomi98.com`
- سرور Runflare: آلمان (Hetzner) - IP: `188.40.16.3`
- پروژه Runflare: `angel-ludo`
- سرویس Runflare: `angel-bot`
- ربات تلگرام: `@AngelLudoBot`
- Mini App URL: `https://ali13698.github.io/ludo/`
- API URL (WebSocket): `wss://api.nomi98.com`

## 🔐 تنظیمات امنیتی
- مخزن `angel-bot`: **Private**
- توکن ربات: داخل فایل `index.js` (چون سکرت Runflare وصل نمی‌شه)
- اگه مخزن Public شد، توکن خودکار توسط GitHub باطل می‌شه

## 📁 مخزن `ludo` (Public - بازی)

| فایل | کار |
|------|-----|
| `index.html` | ساختار صفحه، ترتیب لود اسکریپت‌ها |
| `style.css` | استایل کلی، لابی، چت، modal |
| `theme.css` | متغیرهای رنگ CSS |
| `config.js` | CFG, PATH (۵۲ خانه), SAFE, P (۴ رنگ), BOT_NAMES, DICE_FACES |
| `state.js` | window.S (وضعیت بازی), window.DOM, initDOM() |
| `sfx.js` | window.SFX - صداها (dice, step, capture, home, win, click) |
| `dice.js` | window.Dice - تاس ۳بعدی |
| `rules.js` | window.Rules - قوانین، canMove, wouldStack, checkWin |
| `movement.js` | window.Move.start() - انیمیشن حرکت مهره |
| `bot-opponent.js` | window.BotOpponent - ربات داخل کلاینت |
| `bots.js` | window.Bots - هوش ربات آفلاین |
| `timer.js` | window.Timer - تایمر نوبت |
| `turn.js` | window.Turn - مدیریت نوبت |
| `board.js` | window.Board - رندر canvas |
| `ui.js` | window.UI - پروفایل‌ها، استاتوس |
| `online.js` | window.Online - کلاینت WebSocket |
| `chat.js` | window.Chat - چت داخل بازی |
| `settings.js` | window.GameSettings - منوی ⚙️ |
| `game.js` | window.Game - منطق اصلی + doRoll + doMove |
| `init.js` | راه‌اندازی، اتصال event ها |
| `friends.js`, `items.js`, `league.js`, `profile.js`, `shop.js`, `notifications.js` | خالی (برای آینده) |

**ترتیب لود اسکریپت‌ها در index.html (مهم):**
## 📁 مخزن `angel-bot` (Private - سرور)

| فایل | کار |
|------|-----|
| `index.js` | سرور Express + WebSocket + ربات grammy |
| `db.js` | دیتابیس SQLite (users, friends, matches) |
| `matchmaking.js` | Matchmaker - صف + تطبیق + ربات بعد ۵-۱۰s |
| `bot-pool.js` | BotPool - ۸۰ ربات با اسم فونتی |
| `package.json` | dependencies |

**dependencies:**

## 🗄️ دیتابیس SQLite
- مسیر: `/app/data/angel.db`
- جداول: `users`, `friends`, `matches`

**ستون‌های users:**

## 🔌 پیام‌های WebSocket (سرور ↔ کلاینت)

**کلاینت → سرور:**
- init_user, quick_match, cancel_match, leave_room
- create_room, join_room
- invite_friend, respond_invite
- game_action (dice/move)
- chat_message, emoji
- game_ended
- get_friends, add_friend, accept_friend, remove_friend
- get_leaderboard, get_me, set_name, set_avatar

**سرور → کلاینت:**
- response (با cbId)
- match_found
- opponent_joined, opponent_left
- game_action
- chat_message, chat_history
- emoji
- friend_invite, friend_request, friend_accepted, invite_declined

## 🎮 قوانین پیاده‌شده
- ورود مهره: با ۱ یا ۶ از خونه
- جایزه رول مجدد: فقط ۶
- خوردن حریف: غیر از خونه‌های SAFE
- جلوگیری از روی‌هم‌گذاشتن مهره خودی
- تایمر: ۱۵ ثانیه، اوت بعد ۲ بار
- برد: ۲ یا ۴ مهره در مرکز
- Matchmaking: صف انسانی، بعد ۵-۱۰s با ربات
- ربات: ۷۵٪ بهترین حرکت، ۲۵٪ تصادفی، تاخیر ۱-۳s

## 🐛 باگ‌های باز

| # | باگ | فایل |
|---|-----|------|
| 1 | صدای قدم کمتر از تاسه | sfx.js |
| 2 | ۳/۴ نفره آنلاین کار نمی‌کنه | index.js سرور |
| 3 | اوت شدن حریف → بازی تموم نمی‌شه | turn.js |
| 4 | ربات بار اول matchmaking نمیاد | matchmaking.js |
| 5 | چرخ‌دنده مصنوعیه | style.css |

## ✅ فیکس‌های اخیر
- ورود با ۱ یا ۶
- جلوگیری از stack مهره
- جایزه فقط برای ۶
- رد شدن نوبت بعد timeout
- اسم/آواتار هماهنگ ربات‌ها
- صداها بلندتر

## 🚧 کارهای آینده
- سکه: ۱۰ هدیه ثبت‌نام، ۱ ورود، ۳ برد
- لینک دعوت: ۲۰ سکه
- جایزه روزانه: ۳ بازی = ۵ سکه
- استریک، لیدربورد هفتگی، جعبه شانس
- بازی‌های جدید (پنالتی، مارپله، اسم فامیل، ۲۰۴۸، دوز)

## 🛠️ نحوه ویرایش فایل‌ها
1. روش ترجیحی: GitHub Mobile App → Edit file
2. روش جایگزین: حذف + ساخت جدید
3. سایت GitHub در مرورگر موبایل برای پیست طولانی مشکل داره
4. 
## 🔌 پیام‌های WebSocket (سرور ↔ کلاینت)

**کلاینت → سرور:**
- init_user, quick_match, cancel_match, leave_room
- create_room, join_room
- invite_friend, respond_invite
- game_action (dice/move)
- chat_message, emoji
- game_ended
- get_friends, add_friend, accept_friend, remove_friend
- get_leaderboard, get_me, set_name, set_avatar

**سرور → کلاینت:**
- response (با cbId)
- match_found
- opponent_joined, opponent_left
- game_action
- chat_message, chat_history
- emoji
- friend_invite, friend_request, friend_accepted, invite_declined

## 🎮 قوانین پیاده‌شده
- ورود مهره: با ۱ یا ۶ از خونه
- جایزه رول مجدد: فقط ۶
- خوردن حریف: غیر از خونه‌های SAFE
- جلوگیری از روی‌هم‌گذاشتن مهره خودی
- تایمر: ۱۵ ثانیه، اوت بعد ۲ بار
- برد: ۲ یا ۴ مهره در مرکز
- Matchmaking: صف انسانی، بعد ۵-۱۰s با ربات
- ربات: ۷۵٪ بهترین حرکت، ۲۵٪ تصادفی، تاخیر ۱-۳s

## 🐛 باگ‌های باز

| # | باگ | فایل |
|---|-----|------|
| 1 | صدای قدم کمتر از تاسه | sfx.js |
| 2 | ۳/۴ نفره آنلاین کار نمی‌کنه | index.js سرور |
| 3 | اوت شدن حریف → بازی تموم نمی‌شه | turn.js |
| 4 | ربات بار اول matchmaking نمیاد | matchmaking.js |
| 5 | چرخ‌دنده مصنوعیه | style.css |

## ✅ فیکس‌های اخیر
- ورود با ۱ یا ۶
- جلوگیری از stack مهره
- جایزه فقط برای ۶
- رد شدن نوبت بعد timeout
- اسم/آواتار هماهنگ ربات‌ها
- صداها بلندتر

## 🚧 کارهای آینده
- سکه: ۱۰ هدیه ثبت‌نام، ۱ ورود، ۳ برد
- لینک دعوت: ۲۰ سکه
- جایزه روزانه: ۳ بازی = ۵ سکه
- استریک، لیدربورد هفتگی، جعبه شانس
- بازی‌های جدید (پنالتی، مارپله، اسم فامیل، ۲۰۴۸، دوز)

## 🛠️ نحوه ویرایش فایل‌ها
1. روش ترجیحی: GitHub Mobile App → Edit file
2. روش جایگزین: حذف + ساخت جدید
3. سایت GitHub در مرورگر موبایل برای پیست طولانی مشکل داره
