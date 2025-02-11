import { Link, useNavigate } from "react-router-dom";
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoMdLogOut } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { MdClose } from "react-icons/md";

import axios from "axios";
import { setUser } from "../slices/userSlice";
import auth from "../auth/auth";
import { RootState } from "../store";
import { Spot } from "../types/spot";
import { Challenge } from "../types/challenge";
import { setAuth } from "../slices/authenticateSlice";

import './Profile.css'

function Profile() {
  //functional hooks
  const dispatch = useDispatch();
  const navigate = useNavigate();

  //global states
  const user = useSelector((state: RootState) => state.user);
  const authFlag = useSelector((state: RootState) => state.auth);

  //local states
  let [spots, setSpots] = useState<Spot[]>([]);
  let [deleteUser, setDeleteUser] = useState<boolean>(false);
  let [password, setPassword] = useState<string>("");
  let [likedSpots, setLikedSpots] = useState<Spot[]>([]);
  let [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    //authenticates user and then gets a list of spots that they found
    let foundSpots = axios.get<Spot[]>(
      `http://localhost:3000/spot/getAuthorSpots/${user.value}`,
      {
        withCredentials: true,
      },
    );

    let likesSpots = axios.get<Spot[]>(
      `http://localhost:3000/spot/getLikedSpots/${user.value}`,
      {
        withCredentials: true,
      },
    );

    let challenges = axios.get<Challenge[]>(
      `http://localhost:3000/challenge/getCompletedChallenges/${user.value}`,
      {
        withCredentials: true,
      },
    );

    Promise.all([foundSpots, likesSpots, challenges])
      .then(([foundSpots, likesSpots, challenges]) => {
        setLikedSpots(likesSpots.data);
        setSpots(foundSpots.data);
        setChallenges(challenges.data);
      })
      .catch((err) => {
        if (err.response.status === 401) {
          dispatch(setAuth(false));
          console.log("user not authenticaed please log in");
        } else {
          console.log(err, "test");
        }
      });
  }, []);

  auth(authFlag.value);

  function logout() {
    //sets the users name to empty string, tells the server to log out and then sends the user back to the login page
    console.log("test");
    dispatch(setUser(""));
    axios
      .get("http://localhost:3000/user/logout", {
        withCredentials: true,
      })
      .then((res) => {
        localStorage.removeItem("user");
        dispatch(setUser(null));
        navigate("/");
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function deleteSpot(spotName: string) {
    axios
      .delete(`http://localhost:3000/spot/deleteSpot/${spotName}`, {
        withCredentials: true,
      })
      .then((res) => {
        setSpots(spots.filter((spot) => spot.name != spotName));
        setLikedSpots(likedSpots.filter((spot) => spot.name != spotName))
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function deleteUserConfirmed() {
    axios
      .post(
        "http://localhost:3000/user/deleteUser",
        {
          user: user.value,
          password: password,
        },
        {
          withCredentials: true,
        },
      )
      .then((res) => {
        localStorage.removeItem("user");
        dispatch(setUser(null));
        window.location.replace("/");
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function updatePassword(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
  }

  return (
    <div id="profile">
      {deleteUser ? (
        <div className="deleteCheck">
          <div className="delete-box">
            <MdClose
              size="20"
              className="close-icon"
              onClick={() => setDeleteUser(false)}
            />
            <h2>Are you sure you want to delete your account</h2>
            <h3>
              This action is permanent and you cannot recover your account once
              deleted
            </h3>
            <input
              type="text"
              onChange={updatePassword}
              value={password}
              placeholder="enter your password"
            />
            <button onClick={deleteUserConfirmed} className="delete">
              Delete account
            </button>
          </div>
        </div>
      ) : null}
      <div id="profile-body">
        <div className="profile-top-bar">
          <Link to="/mapScreen">
            <IoArrowBackCircleOutline size="40" color="black" />
          </Link>
          <h1 className="profile-item">{user.value}</h1>
          <div className="logout">
            <MdDelete
              id="deleteIcon"
              size="40"
              color="black"
              onClick={() => setDeleteUser(true)}
            />
            <IoMdLogOut size="40" color="black" onClick={logout} />
          </div>
        </div>

        <div className="profile-field">
          <h2 className="profile-header">My Spots:</h2>
          <div className="your-spots">
            {spots.length == 0 ? (
              <h2>You have discovered no spots yet. Go explore!</h2>
            ) : (
              spots.map((spot: Spot) => {
                return (
                  <Link to={`/spotExpanded/${spot.name}`}>
                  <div key={spot.name} className="profile-spot" title={spot.name} >
                    <div className="profile-spot-info">
                      <h3>{spot.name}</h3>
                      <h3>likes: {spot.likedBy.length}</h3>
                    </div>
                    <div className="image-side">
                      
                      <img
                        src={spot.imagePaths[0]}
                        height="100px"
                      />
                    </div>
                    <button
                        className="delete"
                        onClick={(e) => {e.preventDefault(); deleteSpot(spot.name)}}
                      >
                        <MdDelete></MdDelete>
                      </button>
                    
                  </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="field-divider"></div>
        <div className="profile-field">
          <h2 className="profile-header">Liked spots:</h2>
          <div className="your-spots">
            {likedSpots.length == 0 ? (
              <h2>You haven't liked any spots</h2>
            ) : (
              likedSpots.map((spot: Spot) => {
                return (
                  <Link to={`/spotExpanded/${spot.name}`}>
                  <div key={spot.name} className="profile-spot">
                    <div className="profile-spot-info">
                      <h3>{spot.name}</h3>    
                    </div>
                    <div className="image-side">
                      <img
                        src={spot.imagePaths[0]}
                        height="100px"
                      />
                    </div>
                  </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
        <div className="field-divider"></div>
        <div className="profile-field">
        <h2 className="profile-header">Challenges:</h2>
          <div className="your-spots">
            {challenges.map((challenge: Challenge) => {
              return (
                <button className="profile-challenge" onClick={() =>
                  navigate(`/spotExpanded/${challenge.spotName}`)
                }>
                  <h3>{challenge.challenge}</h3>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
