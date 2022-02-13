# This is a version of the program that would be run locally on a user's computer.
# (Completed by Arsenal6789#6449)

from tkinter import *
from urllib.request import urlopen
from country_list import countries_for_language
from newsweather import news, weather
import requests

url = 'http://api.openweathermap.org/geo/1.0/direct?q=%7Bcity name},{state code},{countrycode}&limit={limit}&appid={31b68aa2df700b29c325496f14e75f06}"
x = requests.get(f'https://guts22.dukedan.uk/api/weather?city=%7Bcity%7D%27) # 'city' contains city name, e.g. Glasgow
print(x.status_code) # will be 200 if request was successful. If code starts with 5 or 4 an error has occurred.
weather_data = x.json()
if weather_data['success'] == True:
  print(weather_data['data'])
else:
  print(weather_data['reason'])


def weather(country, location):
    if type(country) != str or type(location) != str or len(country)==0 or len(location)==0:
        return "Invalid parameter(s) for program. Please enter valid parameters"
    country = country.title()
    string = "Weather in " + country
    location = location.title()
    string += ", "+location
    print(string)
    country = country.lower()
    if country=="uk" or country=="united kingdom":
        country = "uk"
    elif country=="usa" or country=="united states" or country == "united states of america":
        country = "united_states_of_america"





def addcolleague(name, city):
    pass

    def search():
    pass

# ----Create an application Window
application = Tk()
application.title('Weather Condition in Colleagues Location')
application.geometry('700x350')

# ----City Text
city_text= StringVar()
city_entry= Entry(application.textvariable=city_text)
city_entry.pack()

# ----Search button
searchbtn= Button(application,text=Search weather", width=12, command=search)
search_btn.pack()

# ---- location
location_lbl=label(application,text='', font('bold',20)
  location_lbl.pack()

 image = Label(application, bitmap'')
 image.pack()
 
temp_lbl= Label(application, text= ';)
temp_lbl.pack()


I
# ---- Images for Display
image = Label(root, bitmap="")
image.pack()

temp_lbl = Label(root, text="")
temp_lbl.pack()

weather_lbl = Label(root, text="")
weather_lbl.pack()

colleagues = []

root.mainloop()