const { App } = require('@slack/bolt')
const Client = require("@replit/database")
const database = new Client()

const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
})

async function main () {
    await app.start(process.env.PORT || 3000)

    app.command('/todolistremove', async ({ command, ack, say }) => {
        await ack()
        let currentUserTodo = JSON.parse(await database.get(command.user_id)) || [] // Same as previous command
        let removed = currentUserTodo[command.text - 1] // Store the value that will be removed so we can show "Removed xxxxxxxx from your todo list" later
        currentUserTodo.splice(command.text - 1, 1) // Splice the array and remove the item at the provided item number from todo list
        await database.set(command.user_id, JSON.stringify(currentUserTodo)) // Set the array in the database
        await say(`Removed\n• ${removed}\n from your todo list`)
      })

      app.command('/wicsprojects', async ({ command, ack, say }) => {
        await ack()

        let currentProjects = JSON.parse(await database.get("projects")) || [] // Get the user's array, and if the user has never used this todo list before, use an empty array

        // Nicely format the array as a list with numbers
        let response = ""
        currentProjects.forEach((project, index) => {
          if(index % 2 == 1){
            response += `\n:purple_heart: ${project["project"]}`
          }
          else {
            response += `\n:black_heart: ${project["project"]}`
          }
        })

          // If the user has items in the todo list, respond with it. Otherwise, send a message stating the list is empty
          if (response) {
              await say({
                blocks: [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": ":purple_heart: *WiCS Project List* :purple_heart:"
                  }
                },
                {
                  "type": "divider"
                },
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": `This list has been created by members of WiCS. Each project should take roughly around 1 hour to complete.`
                  }
                },
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": response
                  }
                }
              ]
            })
          } else {
              await say(`Your project list is currently empty!`)
          }
            
        })

      app.command('/wicsaddproject', async ({ command, ack, say }) => {
        await ack()
        let currentProjects = JSON.parse(await database.get("projects")) || [] // Same as previous command, get the array, if it doesn't exist, use an empty one
        currentProjects.push({
          "project": command.text,
          "user_id": command.user_id
        }) // Add the new item to the array
         await database.set("projects", JSON.stringify(currentProjects)) // Set the array in the database
        await say({
          blocks: [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": ":memo: *Thank you for your project submission!* :memo:"
              }
            },
            {
              "type": "divider"
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": `Thank you, <@${command.user_id}>! I've added *${command.text}* to our list of projects.`
              }
            }
          ]
        })
    })

    app.command('/wicsclearprojects', async ({ command, ack, say }) => {
        await ack()
        await database.empty("projects")
        // Set the array in the database
        await say(`Cleared our project list.`)
      })

    app.command('/wicscleanprojects', async ({ command, ack, say }) => {
      await ack()
      let currentProjects = JSON.parse(await database.get("projects")) || []
      let result = []
      currentProjects.forEach((item) => {
        let dup = false
        result.forEach((item2, index) => {
          if(item2["project"].indexOf(item["project"]) != -1){
            dup = true
          }
        })
        if(!dup) { result.push(item) }
      })
      await database.set("projects", JSON.stringify(result)) // Set the array in the database
      await say(`Cleaned project list.`)
    })

    console.log('⚡️ Server ready')
}

main()