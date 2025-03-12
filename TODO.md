[x] collapsable chat panel
[x] implement chats tabs
[x] remove text from textarea, once the send button is clicked.
[x] show indication that the ai is responding
[x] format text received from ai (only markdown)
[x] modify app name
[x] create a welcome chat, it should be a chat which introduces the website
[x] locals storage for non auth users

General:
- Modify favicon
- Add delete account
- Implement auth (Add new sign in page, add login button)
- Allow auth only through github and google
- Add payments
- Add more models
- Configure logs
- Configure analytics
- Remove all files created by the starter kit


Chats:
- Store chats of authenticated users in db
- Name new chats automatically (as soon as the first prompt is created)
- Add button to rename chats
- Add button to delete chats
- Add loading indicator while fetching chats (when fetching from db)
- Allow to modify previous chats
- Format latex
- Allow to add images to prompts
- Allow to add pdfs to prompts
- Add code blocks
- Add scroll to bottom button
- Make chat panel full screen on phone
- Make text area bigger, to allow for new lines (\n)
- Add button to copy response
- Limit new users to 5 chats, and show it in the welcome chat

Optimizations:
- Laravel octane?
- Cache chats?
- Buy servers to host models